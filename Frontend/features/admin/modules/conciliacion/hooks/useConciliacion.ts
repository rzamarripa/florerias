import { useState, useCallback } from 'react';
import { 
  ProviderGroup, 
  MovimientoBancario, 
  Conciliacion
} from '../types';
import { conciliacionService } from '../services';

export const useConciliacion = () => {
  const [providerGroups, setProviderGroups] = useState<ProviderGroup[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoBancario[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [conciliacionesPendientes, setConciliacionesPendientes] = useState<Conciliacion[]>([]);
  const [providerGroupsRestantes, setProviderGroupsRestantes] = useState<ProviderGroup[]>([]);
  const [movimientosRestantes, setMovimientosRestantes] = useState<MovimientoBancario[]>([]);
  const [selectedProviderGroups, setSelectedProviderGroups] = useState<string[]>([]);
  const [selectedMovimiento, setSelectedMovimiento] = useState<string>('');
  const [selectedMovimientos, setSelectedMovimientos] = useState<string[]>([]);
  const [currentFilters, setCurrentFilters] = useState<{
    companyId: string;
    bankAccountId: string;
    fecha: string;
  } | null>(null);

  const loadData = useCallback(async (filters: {
    companyId: string;
    bankAccountId: string;
    fecha: string;
  }) => {
    setLoading(true);
    setSelectedProviderGroups([]);
    setSelectedMovimiento('');
    setSelectedMovimientos([]);
    setCurrentFilters(filters);
    
    try {
      const [providerGroupsResponse, movimientosResponse] = await Promise.all([
        conciliacionService.getProviderGroupsParaConciliacion(
          filters.companyId,
          filters.bankAccountId,
          filters.fecha
        ),
        conciliacionService.getMovimientosParaConciliacion(
          filters.companyId,
          filters.bankAccountId,
          filters.fecha
        )
      ]);

      if (providerGroupsResponse.success) {
        setProviderGroups(providerGroupsResponse.data);
      }

      if (movimientosResponse.success) {
        setMovimientos(movimientosResponse.data);
      }
    } catch {
      setProviderGroups([]);
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleProviderGroupSelect = useCallback((providerGroupId: string) => {
    setSelectedProviderGroups(prev => {
      if (prev.includes(providerGroupId)) {
        return prev.filter(id => id !== providerGroupId);
      } else {
        return [...prev, providerGroupId];
      }
    });
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
    fecha: string;
  }) => {
    setLoading(true);
    try {
      const response = await conciliacionService.conciliacionAutomatica(filters);

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
      alert('Error en la conciliación automática');
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
    if (providerGroupIds.length === 0 || movimientoIds.length === 0) {
      alert('Debe seleccionar al menos un proveedor agrupado y un movimiento bancario');
      return;
    }

    setLoading(true);
    try {
      const promises = providerGroupIds.map(providerGroupId =>
        conciliacionService.conciliacionDirectaProvider({
          providerGroupId,
          movimientoIds,
          comentario: comentario || 'Conciliación directa'
        })
      );

      const responses = await Promise.all(promises);
      const allSuccess = responses.every(response => response.success);

      if (allSuccess) {
        alert('Conciliación realizada exitosamente');
        setSelectedProviderGroups([]);
        setSelectedMovimientos([]);
        if (currentFilters) {
          await loadData(currentFilters);
        }
      } else {
        alert('Algunas conciliaciones fallaron');
      }
    } catch {
      alert('Error al realizar la conciliación');
    } finally {
      setLoading(false);
    }
  }, [currentFilters, loadData]);

  const handleCerrarConciliacion = async () => {
    if (conciliacionesPendientes.length === 0) {
      alert('No hay conciliaciones pendientes para procesar.');
      return;
    }

    setLoading(true);
    try {
      const response = await conciliacionService.cerrarConciliacion({
        conciliaciones: conciliacionesPendientes
      });

      if (response.success) {
        alert(response.message);
        resetModal();
        setSelectedProviderGroups([]);
        setSelectedMovimiento('');
        setSelectedMovimientos([]);
      }
    } catch {
      alert('Error al cerrar la conciliación');
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
    movimientos,
    loading,
    showModal,
    conciliacionesPendientes,
    providerGroupsRestantes,
    movimientosRestantes,
    selectedProviderGroups,
    selectedMovimiento,
    selectedMovimientos,
    loadData,
    handleProviderGroupSelect,
    handleMovimientoSelect,
    handleMovimientosSelect,
    handleConciliarAutomatico,
    handleConciliacionManual,
    handleConciliacionDirecta,
    handleCerrarConciliacion,
    resetModal,
  };
}; 