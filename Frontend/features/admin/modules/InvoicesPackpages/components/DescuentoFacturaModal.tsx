import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { updateImporteAPagar } from '../services/invoicesPackpage';

interface DescuentoFacturaModalProps {
  show: boolean;
  onClose: () => void;
  saldo: number;
  invoiceId: string | null;
  onSuccess: () => void;
}

const DescuentoFacturaModal: React.FC<DescuentoFacturaModalProps> = ({
  show,
  onClose,
  saldo,
  invoiceId,
  onSuccess,
}) => {
  const [porcentaje, setPorcentaje] = useState('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cálculo de descuento y nuevo importe a pagar
  const descuento = porcentaje !== '' ? (parseFloat(porcentaje) / 100) * saldo : 0;
  const nuevoImporte = saldo - descuento;

  const handleApply = async () => {
    setError('');
    if (!invoiceId) return;
    const valPorcentaje = parseFloat(porcentaje);
    if (isNaN(valPorcentaje) || valPorcentaje <= 0 || valPorcentaje >= 100) {
      setError('Ingresa un porcentaje de descuento válido.');
      return;
    }
    if (!motivo.trim()) {
      setError('El motivo del descuento es obligatorio.');
      return;
    }
    try {
      setLoading(true);
      await updateImporteAPagar(invoiceId, nuevoImporte, motivo, parseFloat(porcentaje));
      toast.success('Importe actualizado correctamente');
      onSuccess();
      onClose();
    } catch (error) {
      setError('Error al actualizar el importe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Body className="text-center p-4">
        <div className="mb-3 d-flex justify-content-center">
          <div className="bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: 64, height: 64 }}>
            <i className="bi bi-question-lg fs-1 text-secondary"></i>
          </div>
        </div>
        <h4 className="fw-bold mb-2">Aplicar Descuento</h4>
        <div className="mb-2">Saldo actual: <span className="fw-medium">{saldo.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span></div>
        <Form.Group className="mb-2">
          <Form.Control
            type="number"
            min="0"
            max="100"
            value={porcentaje}
            onChange={e => setPorcentaje(e.target.value)}
            placeholder="% Porcentaje"
            className=""
            disabled={loading}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Control
            as="textarea"
            rows={2}
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            placeholder="Motivo del descuento"
            className="shadow-none"
            disabled={loading}
          />
        </Form.Group>
        <div className="row mb-3 text-center">
          <div className="col">
            <div className="fw-bold text-warning">Descuento</div>
            <div className="fs-5 text-warning">{descuento.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</div>
          </div>
          <div className="col">
            <div className="fw-bold text-success">Nuevo Importe</div>
            <div className="fs-5 text-success">{nuevoImporte.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</div>
          </div>
          <div className="col">
            <div className="fw-bold text-primary">Ahorro</div>
            <div className="fs-5 text-primary">{porcentaje !== '' ? parseFloat(porcentaje).toFixed(2) : '0.00'}%</div>
          </div>
        </div>
        <Alert variant="warning" className="mb-0">
          <b>Nota:</b> Este descuento actualizará el importe a pagar de la factura en el sistema.
        </Alert>
        {error && <Alert variant="danger" className="mt-2">{error}</Alert>}
        <div className="d-flex justify-content-center gap-2 mt-4">
          <Button className="bg-primary border-0 px-4" onClick={handleApply} disabled={loading}>
            {loading ? 'Aplicando...' : 'Aplicar Descuento'}
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default DescuentoFacturaModal; 