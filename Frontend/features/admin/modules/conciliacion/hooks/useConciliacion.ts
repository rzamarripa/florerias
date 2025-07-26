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

  const loadData = useCallback(async (filters: {
    companyId: string;
    bankAccountId: string;
    fecha: string;
  }) => {
    setLoading(true);
    try {
      const [facturasResponse, movimientosResponse] = await Promise.all([
        conciliacionService.getFacturasParaConciliacion(
          filters.companyId,
          filters.bankAccountId,
          filters.fecha
        ),
        conciliacionService.getMovimientosParaConciliacion(
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
    } catch (error) {
      console.error('Error loading data:', error);
      setFacturas([]);
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
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
    } catch (error) {
      console.error('Error en conciliación automática:', error);
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
        // Note: We don't auto-reload data here. Parent should handle it via onFiltersChange
      }
    } catch (error) {
      console.error('Error cerrando conciliación:', error);
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
    loadData,
    handleConciliarAutomatico,
    handleConciliacionManual,
    handleCerrarConciliacion,
    resetModal,
  };
}; 