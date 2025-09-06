import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { 
  ProviderGroup, 
  MovimientoBancario, 
  Conciliacion
} from '../types';
import { conciliacionService } from '../services';

export const useConciliacion = () => {
  const [providerGroups, setProviderGroups] = useState<ProviderGroup[]>([]);
  const [facturasIndividuales, setFacturasIndividuales] = useState<any[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoBancario[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [conciliacionesPendientes, setConciliacionesPendientes] = useState<Conciliacion[]>([]);
  const [providerGroupsRestantes, setProviderGroupsRestantes] = useState<ProviderGroup[]>([]);
  const [movimientosRestantes, setMovimientosRestantes] = useState<MovimientoBancario[]>([]);
  const [selectedProviderGroups, setSelectedProviderGroups] = useState<string[]>([]);
  const [selectedFacturasIndividuales, setSelectedFacturasIndividuales] = useState<string[]>([]);
  const [selectedMovimiento, setSelectedMovimiento] = useState<string>('');
  const [selectedMovimientos, setSelectedMovimientos] = useState<string[]>([]);
  const [layoutType, setLayoutType] = useState<'grouped' | 'individual'>('grouped');
  const [currentFilters, setCurrentFilters] = useState<{
    companyId: string;
    bankAccountId: string;
  } | null>(null);
  const [fechaFacturas, setFechaFacturas] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [fechaMovimientos, setFechaMovimientos] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  const loadFacturas = useCallback(async (filters: {
    companyId: string;
    bankAccountId: string;
  }, fecha: string) => {
    if (!filters.companyId || !filters.bankAccountId || !fecha) return;
    
    setLoading(true);
    setSelectedProviderGroups([]);
    setSelectedFacturasIndividuales([]);
    
    try {
      if (layoutType === 'grouped') {
        const providerGroupsResponse = await conciliacionService.getProviderGroupsParaConciliacion(
          filters.companyId,
          filters.bankAccountId,
          fecha
        );

        if (providerGroupsResponse.success) {
          setProviderGroups(providerGroupsResponse.data);
        }
        setFacturasIndividuales([]);
      } else {
        // Layout individual
        const facturasIndividualesResponse = await conciliacionService.getFacturasIndividualesParaConciliacion(
          filters.companyId,
          filters.bankAccountId,
          fecha
        );

        if (facturasIndividualesResponse.success) {
          setFacturasIndividuales(facturasIndividualesResponse.data);
        }
        setProviderGroups([]);
      }
    } catch {
      setProviderGroups([]);
      setFacturasIndividuales([]);
    } finally {
      setLoading(false);
    }
  }, [layoutType]);

  const loadMovimientos = useCallback(async (filters: {
    companyId: string;
    bankAccountId: string;
  }, fecha: string) => {
    if (!filters.companyId || !filters.bankAccountId || !fecha) return;
    
    setLoading(true);
    setSelectedMovimiento('');
    setSelectedMovimientos([]);
    
    try {
      const movimientosResponse = await conciliacionService.getMovimientosParaConciliacion(
        filters.companyId,
        filters.bankAccountId,
        fecha
      );

      if (movimientosResponse.success) {
        setMovimientos(movimientosResponse.data);
      }
    } catch {
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAllData = useCallback(async (filters: {
    companyId: string;
    bankAccountId: string;
  }) => {
    if (!filters.companyId || !filters.bankAccountId || !fechaFacturas || !fechaMovimientos) return;
    
    setLoading(true);
    setSelectedProviderGroups([]);
    setSelectedFacturasIndividuales([]);
    setSelectedMovimiento('');
    setSelectedMovimientos([]);
    setCurrentFilters(filters);
    
    try {
      const promises = [
        loadFacturas(filters, fechaFacturas),
        loadMovimientos(filters, fechaMovimientos)
      ];
      
      await Promise.all(promises);
    } finally {
      setLoading(false);
    }
  }, [fechaFacturas, fechaMovimientos, loadFacturas, loadMovimientos]);

  const handleProviderGroupSelect = useCallback((providerGroupId: string) => {
    setSelectedProviderGroups(prev => {
      if (prev.includes(providerGroupId)) {
        return prev.filter(id => id !== providerGroupId);
      } else {
        return [...prev, providerGroupId];
      }
    });
  }, []);

  const handleFacturaIndividualSelect = useCallback((facturaId: string) => {
    setSelectedFacturasIndividuales(prev => {
      if (prev.includes(facturaId)) {
        return prev.filter(id => id !== facturaId);
      } else {
        return [...prev, facturaId];
      }
    });
  }, []);

  const handleLayoutTypeChange = useCallback((newLayoutType: 'grouped' | 'individual') => {
    setLayoutType(newLayoutType);
    setSelectedProviderGroups([]);
    setSelectedFacturasIndividuales([]);
    setSelectedMovimiento('');
    setSelectedMovimientos([]);
    setProviderGroups([]);
    setFacturasIndividuales([]);
  }, []);

  const handleFechaFacturasChange = useCallback((nuevaFecha: string) => {
    setFechaFacturas(nuevaFecha);
  }, []);

  const handleFechaMovimientosChange = useCallback((nuevaFecha: string) => {
    setFechaMovimientos(nuevaFecha);
  }, []);

  const handleMovimientoSelect = useCallback((movimientoId: string) => {
    setSelectedMovimiento(prev => prev === movimientoId ? '' : movimientoId);
  }, []);

  const handleMovimientosSelect = useCallback((movimientoId: string) => {
    setSelectedMovimientos(prev => {
      if (prev.includes(movimientoId)) {
        return prev.filter(id => id !== movimientoId);
      } else {
        return [...prev, movimientoId];
      }
    });
  }, []);

  const handleConciliarAutomatico = async (filters: {
    companyId: string;
    bankAccountId: string;
    fechaFacturas: string;
    fechaMovimientos: string;
  }) => {
    setLoading(true);
    try {
      // Usar fechaFacturas como la fecha principal para la conciliación automática
      const conciliacionFilters = {
        companyId: filters.companyId,
        bankAccountId: filters.bankAccountId,
        fecha: filters.fechaFacturas
      };
      const response = await conciliacionService.conciliacionAutomatica(conciliacionFilters);

      if (response.success) {
        const { coincidencias, movimientosNoCoinciden } = response.data;
        
        setConciliacionesPendientes(coincidencias.map(c => ({
          facturaId: c.factura._id,
          movimientoId: c.movimiento._id,
          comentario: 'Conciliación automática',
          referenciaConciliacion: c.referenciaConciliacion,
          tipo: 'automatica' as const
        })));

        setProviderGroupsRestantes(providerGroups.filter(pg => 
          !coincidencias.some(c => pg.facturas?.includes(c.factura._id))
        ));
        setMovimientosRestantes(movimientosNoCoinciden);

        if (providerGroupsRestantes.length > 0 || movimientosNoCoinciden.length > 0) {
          setShowModal(true);
        } else {
          await handleCerrarConciliacion();
        }
      }
    } catch {
      toast.error('Error en la conciliación automática', {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConciliacionManual = (providerGroupId: string, movimientoId: string, comentario: string) => {
    const providerGroup = providerGroups.find(pg => pg._id === providerGroupId);
    if (!providerGroup) return;

    const nuevasConciliaciones: Conciliacion[] = providerGroup.facturas.map(facturaId => ({
      facturaId,
      movimientoId,
      comentario: comentario || 'Conciliación manual',
      tipo: 'manual'
    }));

    setConciliacionesPendientes([...conciliacionesPendientes, ...nuevasConciliaciones]);
    setProviderGroupsRestantes(providerGroupsRestantes.filter(pg => pg._id !== providerGroupId));
    setMovimientosRestantes(movimientosRestantes.filter(m => m._id !== movimientoId));
  };

  const handleConciliacionDirecta = useCallback(async (providerGroupIds: string[], movimientoIds: string[], comentario?: string) => {
    setLoading(true);
    
    try {
      let items: string[];
      let tipo: 'individual' | 'grouped';

      if (layoutType === 'grouped') {
        if (providerGroupIds.length === 0 || movimientoIds.length === 0) {
          toast.warn('Debe seleccionar al menos un proveedor agrupado y un movimiento bancario', {
            position: "top-right",
            autoClose: 4000,
          });
          return;
        }
        items = providerGroupIds;
        tipo = 'grouped';
      } else {
        if (selectedFacturasIndividuales.length === 0 || movimientoIds.length === 0) {
          toast.warn('Debe seleccionar al menos una factura y un movimiento bancario', {
            position: "top-right",
            autoClose: 4000,
          });
          return;
        }
        items = selectedFacturasIndividuales;
        tipo = 'individual';
      }

      const response = await conciliacionService.conciliacionConValidaciones({
        tipo,
        items,
        movimientoIds,
        comentario: comentario || 'Conciliación directa con validaciones'
      });

      if (response.success) {
        toast.success(response.message, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setSelectedProviderGroups([]);
        setSelectedFacturasIndividuales([]);
        setSelectedMovimientos([]);
        // Recargar datos automáticamente
        if (currentFilters) {
          await loadAllData(currentFilters);
        }
      } else {
        // Mostrar cada error en un toast separado con mejor formato
        if (response.errores && response.errores.length > 0) {
          response.errores.forEach((error: string) => {
            // Dividir el error en título y detalles si contiene saltos de línea
            const lines = error.split('\n');
            const titulo = lines[0];
            const detalles = lines.slice(1);
            
            // Crear el mensaje del toast
            let mensajeToast = titulo;
            if (detalles.length > 0) {
              mensajeToast += '\n\n' + detalles.join('\n');
            }
            
            toast.error(mensajeToast, {
              position: "top-right",
              autoClose: 12000, // 12 segundos para dar tiempo a leer
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              style: {
                whiteSpace: 'pre-line', // Preservar saltos de línea
                fontSize: '14px',
                lineHeight: '1.4'
              }
            });
          });
        }
        
        // Mostrar mensaje principal como toast informativo
        toast.warn(`❌ ${response.message} (${response.errores?.length || 0} ${response.errores?.length === 1 ? 'error' : 'errores'})`, {
          position: "top-right",
          autoClose: 6000,
          style: {
            fontSize: '14px',
            fontWeight: 'bold'
          }
        });
      }
    } catch (error: any) {
      // Verificar si es un error de validación (status 400) con datos estructurados
      if (error?.status === 400 && error?.data) {
        const { success, message, errores } = error.data;
        
        if (!success && errores && errores.length > 0) {
          // Mostrar cada error en un toast separado con mejor formato
          console.log('Mostrando errores en toast:', errores);
          errores.forEach((errorMsg: string) => {
            // Dividir el error en título y detalles si contiene saltos de línea
            const lines = errorMsg.split('\n');
            const titulo = lines[0];
            const detalles = lines.slice(1);
            
            // Crear el mensaje del toast
            let mensajeToast = titulo;
            if (detalles.length > 0) {
              mensajeToast += '\n\n' + detalles.join('\n');
            }
            
            toast.error(mensajeToast, {
              position: "top-right",
              autoClose: 12000, // 12 segundos para dar tiempo a leer
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              style: {
                whiteSpace: 'pre-line', // Preservar saltos de línea
                fontSize: '14px',
                lineHeight: '1.4'
              }
            });
          });
          
          // Mostrar mensaje principal como toast informativo
          toast.warn(`❌ ${message} (${errores.length} ${errores.length === 1 ? 'error' : 'errores'})`, {
            position: "top-right",
            autoClose: 6000,
            style: {
              fontSize: '14px',
              fontWeight: 'bold'
            }
          });
        } else {
          // Error 400 sin estructura de errores esperada
          toast.error(`Error de validación: ${message || 'Error desconocido'}`, {
            position: "top-right",
            autoClose: 8000,
          });
        }
      } else {
        // Otros tipos de error (red, 500, etc.)
        toast.error('Error al realizar la conciliación: ' + (error.message || 'Error desconocido'), {
          position: "top-right",
          autoClose: 8000,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [layoutType, selectedFacturasIndividuales, currentFilters, loadAllData]);

  const handleCerrarConciliacion = async () => {
    if (conciliacionesPendientes.length === 0) {
      toast.warn('No hay conciliaciones pendientes para procesar.', {
        position: "top-right",
        autoClose: 4000,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await conciliacionService.cerrarConciliacion({
        conciliaciones: conciliacionesPendientes
      });

      if (response.success) {
        toast.success(response.message, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        resetModal();
        setSelectedProviderGroups([]);
        setSelectedMovimiento('');
        setSelectedMovimientos([]);
      }
    } catch {
      toast.error('Error al cerrar la conciliación', {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setConciliacionesPendientes([]);
    setProviderGroupsRestantes([]);
    setMovimientosRestantes([]);
  };

  return {
    providerGroups,
    facturasIndividuales,
    movimientos,
    loading,
    showModal,
    conciliacionesPendientes,
    providerGroupsRestantes,
    movimientosRestantes,
    selectedProviderGroups,
    selectedFacturasIndividuales,
    selectedMovimiento,
    selectedMovimientos,
    layoutType,
    fechaFacturas,
    fechaMovimientos,
    loadAllData,
    handleProviderGroupSelect,
    handleFacturaIndividualSelect,
    handleMovimientoSelect,
    handleMovimientosSelect,
    handleLayoutTypeChange,
    handleFechaFacturasChange,
    handleFechaMovimientosChange,
    handleConciliarAutomatico,
    handleConciliacionManual,
    handleConciliacionDirecta,
    handleCerrarConciliacion,
    resetModal,
  };
}; 