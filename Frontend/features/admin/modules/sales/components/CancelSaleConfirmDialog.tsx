"use client";

import React from "react";
import { Modal, Button } from "react-bootstrap";
import { AlertTriangle } from "lucide-react";

interface CancelSaleConfirmDialogProps {
  show: boolean;
  onHide: () => void;
  onConfirm: () => void;
  saleOrderNumber: string;
  isProcessing: boolean;
}

const CancelSaleConfirmDialog: React.FC<CancelSaleConfirmDialogProps> = ({
  show,
  onHide,
  onConfirm,
  saleOrderNumber,
  isProcessing,
}) => {
  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Modal.Header closeButton={!isProcessing}>
        <Modal.Title className="fw-bold">Cancelar Venta</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center mb-4">
          <div
            className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
            style={{
              width: "80px",
              height: "80px",
              backgroundColor: "#fff3cd",
            }}
          >
            <AlertTriangle size={40} className="text-warning" />
          </div>
          <h5 className="mb-3">¿Estás seguro de cancelar esta venta?</h5>
          <p className="text-muted mb-2">
            Folio: <strong>{saleOrderNumber}</strong>
          </p>
          <p className="text-muted">
            Esta acción cambiará el estado de la venta a "Cancelado". Los
            productos no se devolverán al inventario automáticamente.
          </p>
        </div>
        <div
          className="alert alert-warning d-flex align-items-start mb-0"
          role="alert"
        >
          <AlertTriangle size={20} className="me-2 mt-1 flex-shrink-0" />
          <div>
            <strong>Nota:</strong> Esta acción no se puede deshacer. La venta
            permanecerá en el sistema con estado "Cancelado".
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onHide} disabled={isProcessing}>
          No, mantener venta
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isProcessing}>
          {isProcessing ? "Cancelando..." : "Sí, cancelar venta"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CancelSaleConfirmDialog;
