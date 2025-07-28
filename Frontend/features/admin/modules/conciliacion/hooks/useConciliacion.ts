import { useState, useCallback } from 'react';
import { 
  Factura, 
  MovimientoBancario, 
  Conciliacion
} from '../types';
import { conciliacionService } from '../services';

export const useConciliacion = () => {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoBancario[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [conciliacionesPendientes, setConciliacionesPendientes] = useState<Conciliacion[]>([]);
  const [facturasRestantes, setFacturasRestantes] = useState<Factura[]>([]);
  const [movimientosRestantes, setMovimientosRestantes] = useState<MovimientoBancario[]>([]);
  const [selectedFactura, setSelectedFactura] = useState<string>('');
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
    // Reset selections when loading new data
    setSelectedFactura('');
    setSelectedMovimiento('');
    setSelectedMovimientos([]);
    // Save current filters for reloading
    setCurrentFilters(filters);
    
    try {
      const [facturasResponse, movimientosResponse] = await Promise.all([
        conciliacionService.getFacturasParaConciliacion(
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

      if (facturasResponse.success) {
        setFacturas(facturasResponse.data);
      }

      if (movimientosResponse.success) {
        setMovimientos(movimientosResponse.data);
      }
    } catch {
      setFacturas([]);
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFacturaSelect = useCallback((facturaId: string) => {
    setSelectedFactura(prev => prev === facturaId ? '' : facturaId);
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
        const { coincidencias, facturasNoCoinciden, movimientosNoCoinciden } = response.data;
        
        setConciliacionesPendientes(coincidencias.map(c => ({
          facturaId: c.factura._id,
          movimientoId: c.movimiento._id,
          comentario: 'Conciliación automática',
          referenciaConciliacion: c.referenciaConciliacion,
          tipo: 'automatica' as const
        })));

        setFacturasRestantes(facturasNoCoinciden);
        setMovimientosRestantes(movimientosNoCoinciden);

        if (facturasNoCoinciden.length > 0 || movimientosNoCoinciden.length > 0) {
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

  const handleConciliacionManual = (facturaId: string, movimientoId: string, comentario: string) => {
    const nuevaConciliacion: Conciliacion = {
      facturaId,
      movimientoId,
      comentario: comentario || 'Conciliación manual',
      tipo: 'manual'
    };

    setConciliacionesPendientes([...conciliacionesPendientes, nuevaConciliacion]);
    setFacturasRestantes(facturasRestantes.filter(f => f._id !== facturaId));
    setMovimientosRestantes(movimientosRestantes.filter(m => m._id !== movimientoId));
  };

  const handleConciliacionDirecta = useCallback(async (facturaId: string, movimientoIds: string[], comentario?: string) => {
    if (!facturaId || movimientoIds.length === 0) {
      alert('Debe seleccionar una factura y al menos un movimiento bancario');
      return;
    }

    setLoading(true);
    try {
      const response = await conciliacionService.conciliacionDirecta({
        facturaId,
        movimientoIds,
        comentario: comentario || 'Conciliación directa'
      });

      if (response.success) {
        alert(response.message || 'Conciliación realizada exitosamente');
        // Reset selections
        setSelectedFactura('');
        setSelectedMovimientos([]);
        // Reload data to reflect changes
        if (currentFilters) {
          await loadData(currentFilters);
        }
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
        setSelectedFactura('');
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
    setFacturasRestantes([]);
    setMovimientosRestantes([]);
  };

  return {
    facturas,
    movimientos,
    loading,
    showModal,
    conciliacionesPendientes,
    facturasRestantes,
    movimientosRestantes,
    selectedFactura,
    selectedMovimiento,
    selectedMovimientos,
    loadData,
    handleFacturaSelect,
    handleMovimientoSelect,
    handleMovimientosSelect,
    handleConciliarAutomatico,
    handleConciliacionManual,
    handleConciliacionDirecta,
    handleCerrarConciliacion,
    resetModal,
  };
}; 