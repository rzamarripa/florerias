"use client";

import { useState, useCallback } from "react";
import { conciliacionService } from "../services/conciliacionService";
import { ProviderGroup } from "../types";
import { toast } from "react-toastify";

export const useConciliacionHistorial = () => {
  const [allProviderGroups, setAllProviderGroups] = useState<ProviderGroup[]>([]);
  const [allFacturasIndividuales, setAllFacturasIndividuales] = useState<any[]>([]);
  const [filteredProviderGroups, setFilteredProviderGroups] = useState<ProviderGroup[]>([]);
  const [filteredFacturasIndividuales, setFilteredFacturasIndividuales] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [layoutType, setLayoutType] = useState<'grouped' | 'individual'>('grouped');
  const [fechaFacturas, setFechaFacturas] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [availableProviders, setAvailableProviders] = useState<Array<{name: string; rfc: string}>>([]);
  const [hasLoadedData, setHasLoadedData] = useState<boolean>(false);

  // Función para extraer proveedores únicos
  const extractProviders = useCallback((providerGroups: ProviderGroup[], facturas: any[]) => {
    const providersSet = new Set<string>();
    const providersMap = new Map<string, {name: string; rfc: string}>();

    // Extraer de agrupaciones
    providerGroups.forEach(group => {
      if (group.providerName && group.providerRfc) {
        const key = `${group.providerRfc}-${group.providerName}`;
        if (!providersSet.has(key)) {
          providersSet.add(key);
          providersMap.set(group.providerName, {
            name: group.providerName,
            rfc: group.providerRfc
          });
        }
      }
    });

    // Extraer de facturas individuales
    facturas.forEach(factura => {
      if (factura.nombreEmisor && factura.rfcEmisor) {
        const key = `${factura.rfcEmisor}-${factura.nombreEmisor}`;
        if (!providersSet.has(key)) {
          providersSet.add(key);
          providersMap.set(factura.nombreEmisor, {
            name: factura.nombreEmisor,
            rfc: factura.rfcEmisor
          });
        }
      }
    });

    return Array.from(providersMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const loadAllData = useCallback(
    async (filters: { companyId: string; bankAccountId: string }) => {
      setLoading(true);
      setHasLoadedData(false);
      setSelectedProvider(""); // Reset provider filter
      
      try {
        if (layoutType === 'grouped') {
          const providerGroupsResponse = await conciliacionService.getProviderGroupsConciliados(
            filters.companyId,
            filters.bankAccountId,
            fechaFacturas
          );
          
          if (providerGroupsResponse.success) {
            const groups = providerGroupsResponse.data || [];
            setAllProviderGroups(groups);
            setFilteredProviderGroups(groups);
            setAllFacturasIndividuales([]);
            setFilteredFacturasIndividuales([]);
            
            // Extraer proveedores únicos solo de las agrupaciones
            const providers = extractProviders(groups, []);
            setAvailableProviders(providers);
          } else {
            toast.error("Error al cargar agrupaciones conciliadas");
            setAllProviderGroups([]);
            setFilteredProviderGroups([]);
            setAvailableProviders([]);
          }
        } else {
          const facturasResponse = await conciliacionService.getFacturasIndividualesConciliadas(
            filters.companyId,
            filters.bankAccountId,
            fechaFacturas
          );
          
          if (facturasResponse.success) {
            const facturas = facturasResponse.data || [];
            setAllFacturasIndividuales(facturas);
            setFilteredFacturasIndividuales(facturas);
            setAllProviderGroups([]);
            setFilteredProviderGroups([]);
            
            // Extraer proveedores únicos solo de las facturas
            const providers = extractProviders([], facturas);
            setAvailableProviders(providers);
          } else {
            toast.error("Error al cargar facturas conciliadas");
            setAllFacturasIndividuales([]);
            setFilteredFacturasIndividuales([]);
            setAvailableProviders([]);
          }
        }
        setHasLoadedData(true);
      } catch (error) {
        console.error("Error loading conciliacion historial data:", error);
        toast.error("Error al cargar datos del historial");
        setAllProviderGroups([]);
        setAllFacturasIndividuales([]);
        setFilteredProviderGroups([]);
        setFilteredFacturasIndividuales([]);
        setAvailableProviders([]);
        setHasLoadedData(false);
      } finally {
        setLoading(false);
      }
    },
    [layoutType, fechaFacturas, extractProviders]
  );

  // Función para filtrar por proveedor en frontend
  const handleProviderChange = useCallback((providerName: string) => {
    setSelectedProvider(providerName);
    
    if (!providerName) {
      // Si no hay proveedor seleccionado, mostrar todos
      setFilteredProviderGroups(allProviderGroups);
      setFilteredFacturasIndividuales(allFacturasIndividuales);
    } else {
      // Filtrar por nombre del proveedor
      if (layoutType === 'grouped') {
        const filtered = allProviderGroups.filter(group => 
          group.providerName === providerName
        );
        setFilteredProviderGroups(filtered);
      } else {
        const filtered = allFacturasIndividuales.filter(factura => 
          factura.nombreEmisor === providerName
        );
        setFilteredFacturasIndividuales(filtered);
      }
    }
  }, [allProviderGroups, allFacturasIndividuales, layoutType]);

  const handleLayoutTypeChange = useCallback((newLayoutType: 'grouped' | 'individual') => {
    setLayoutType(newLayoutType);
    // Limpiar datos cuando cambie el tipo de layout
    setAllProviderGroups([]);
    setAllFacturasIndividuales([]);
    setFilteredProviderGroups([]);
    setFilteredFacturasIndividuales([]);
    setAvailableProviders([]);
    setSelectedProvider("");
    setHasLoadedData(false);
  }, []);

  const handleFechaFacturasChange = useCallback((fecha: string) => {
    setFechaFacturas(fecha);
  }, []);

  const handleEliminarConciliacion = useCallback(
    async (itemId: string, tipo: 'grouped' | 'individual') => {
      const confirmar = window.confirm(
        `¿Estás seguro de que deseas eliminar esta conciliación?\n\nEsto revertirá el estado de conciliación de ${tipo === 'grouped' ? 'la agrupación y todas sus facturas' : 'la factura'} y los movimientos bancarios asociados.`
      );
      
      if (!confirmar) return;
      
      setLoading(true);
      try {
        const response = await conciliacionService.eliminarConciliacion(itemId, tipo);
        
        if (response.success) {
          toast.success('Conciliación eliminada exitosamente');
          
          // Actualizar las listas removiendo el elemento
          if (tipo === 'grouped') {
            const newAllGroups = allProviderGroups.filter(group => group._id !== itemId);
            setAllProviderGroups(newAllGroups);
            
            // También actualizar la lista filtrada
            if (!selectedProvider) {
              setFilteredProviderGroups(newAllGroups);
            } else {
              const newFilteredGroups = newAllGroups.filter(group => group.providerName === selectedProvider);
              setFilteredProviderGroups(newFilteredGroups);
            }
          } else {
            const newAllFacturas = allFacturasIndividuales.filter(factura => factura._id !== itemId);
            setAllFacturasIndividuales(newAllFacturas);
            
            // También actualizar la lista filtrada
            if (!selectedProvider) {
              setFilteredFacturasIndividuales(newAllFacturas);
            } else {
              const newFilteredFacturas = newAllFacturas.filter(factura => factura.nombreEmisor === selectedProvider);
              setFilteredFacturasIndividuales(newFilteredFacturas);
            }
          }
        } else {
          toast.error(response.message || 'Error al eliminar conciliación');
        }
      } catch (error) {
        console.error('Error eliminando conciliación:', error);
        toast.error('Error al eliminar conciliación');
      } finally {
        setLoading(false);
      }
    },
    [allProviderGroups, allFacturasIndividuales, selectedProvider]
  );

  return {
    providerGroups: filteredProviderGroups,
    facturasIndividuales: filteredFacturasIndividuales,
    loading,
    layoutType,
    fechaFacturas,
    selectedProvider,
    availableProviders,
    hasLoadedData,
    loadAllData,
    handleLayoutTypeChange,
    handleFechaFacturasChange,
    handleProviderChange,
    handleEliminarConciliacion,
  };
};