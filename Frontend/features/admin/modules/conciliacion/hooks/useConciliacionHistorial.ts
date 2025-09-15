"use client";

import { useState, useCallback } from "react";
import { conciliacionService } from "../services/conciliacionService";
import { ProviderGroup } from "../types";
import { toast } from "react-toastify";

export const useConciliacionHistorial = () => {
  const [providerGroups, setProviderGroups] = useState<ProviderGroup[]>([]);
  const [facturasIndividuales, setFacturasIndividuales] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [layoutType, setLayoutType] = useState<'grouped' | 'individual'>('grouped');
  const [fechaFacturas, setFechaFacturas] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const loadAllData = useCallback(
    async (filters: { companyId: string; bankAccountId: string }) => {
      setLoading(true);
      try {
        if (layoutType === 'grouped') {
          const providerGroupsResponse = await conciliacionService.getProviderGroupsConciliados(
            filters.companyId,
            filters.bankAccountId,
            fechaFacturas
          );
          
          if (providerGroupsResponse.success) {
            setProviderGroups(providerGroupsResponse.data || []);
          } else {
            toast.error("Error al cargar agrupaciones conciliadas");
            setProviderGroups([]);
          }
        } else {
          const facturasResponse = await conciliacionService.getFacturasIndividualesConciliadas(
            filters.companyId,
            filters.bankAccountId,
            fechaFacturas
          );
          
          if (facturasResponse.success) {
            setFacturasIndividuales(facturasResponse.data || []);
          } else {
            toast.error("Error al cargar facturas conciliadas");
            setFacturasIndividuales([]);
          }
        }
      } catch (error) {
        console.error("Error loading conciliacion historial data:", error);
        toast.error("Error al cargar datos del historial");
        setProviderGroups([]);
        setFacturasIndividuales([]);
      } finally {
        setLoading(false);
      }
    },
    [layoutType, fechaFacturas]
  );

  const handleLayoutTypeChange = useCallback((newLayoutType: 'grouped' | 'individual') => {
    setLayoutType(newLayoutType);
    // Limpiar datos cuando cambie el tipo de layout
    setProviderGroups([]);
    setFacturasIndividuales([]);
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
          
          // Actualizar la lista removiendo el elemento
          if (tipo === 'grouped') {
            setProviderGroups(prev => prev.filter(group => group._id !== itemId));
          } else {
            setFacturasIndividuales(prev => prev.filter(factura => factura._id !== itemId));
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
    []
  );

  return {
    providerGroups,
    facturasIndividuales,
    loading,
    layoutType,
    fechaFacturas,
    loadAllData,
    handleLayoutTypeChange,
    handleFechaFacturasChange,
    handleEliminarConciliacion,
  };
};