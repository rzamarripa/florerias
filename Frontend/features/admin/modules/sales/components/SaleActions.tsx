"use client";

import React, { useState } from "react";
import { Dropdown } from "react-bootstrap";
import { MoreVertical, Eye, Edit, X, DollarSign, Printer, CheckCircle } from "lucide-react";
import { Sale } from "../types";
import PaymentModal from "./PaymentModal";
import SaleDetailModal from "./SaleDetailModal";
import CancelSaleConfirmDialog from "./CancelSaleConfirmDialog";
import RedeemFolioConfirmDialog from "./RedeemFolioConfirmDialog";
import { reprintSaleTicket } from "../utils/reprintSaleTicket";
import { salesService } from "../services/sales";
import { toast } from "react-toastify";
import { useUserSessionStore } from "@/stores/userSessionStore";

interface SaleActionsProps {
  sale: Sale;
  onSaleUpdated: () => void;
  showRedeemFolioAction?: boolean;
  onRedeemFolio?: (orderId: string, folio: string) => void;
}

const SaleActions: React.FC<SaleActionsProps> = ({
  sale,
  onSaleUpdated,
  showRedeemFolioAction = false,
  onRedeemFolio
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const { user } = useUserSessionStore();

  const handleOpenPaymentModal = () => {
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
  };

  const handlePaymentAdded = () => {
    onSaleUpdated();
  };

  const handleOpenDetailModal = () => {
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
  };

  const handleReprintTicket = async () => {
    await reprintSaleTicket(sale, user?.profile?.fullName);
  };

  const handleOpenCancelDialog = () => {
    setShowCancelDialog(true);
  };

  const handleCloseCancelDialog = () => {
    setShowCancelDialog(false);
    setIsCanceling(false);
  };

  const handleConfirmCancel = async () => {
    try {
      setIsCanceling(true);
      await salesService.updateOrderStatus(sale._id, "cancelado");
      toast.success("Venta cancelada exitosamente");
      handleCloseCancelDialog();
      onSaleUpdated();
    } catch (error: any) {
      toast.error(error.message || "Error al cancelar la venta");
      setIsCanceling(false);
    }
  };

  const handleOpenRedeemDialog = () => {
    setShowRedeemDialog(true);
  };

  const handleCloseRedeemDialog = () => {
    setShowRedeemDialog(false);
  };

  const handleConfirmRedeem = async (folio: string) => {
    if (onRedeemFolio) {
      await onRedeemFolio(sale._id, folio);
    }
  };

  return (
    <>
      <Dropdown>
        <Dropdown.Toggle
          variant="light"
          size="sm"
          className="border-0"
          style={{ background: "transparent" }}
        >
          <MoreVertical size={18} />
        </Dropdown.Toggle>

        <Dropdown.Menu align="end">
          <Dropdown.Item onClick={handleOpenDetailModal}>
            <Eye size={16} className="me-2" />
            Ver Detalles
          </Dropdown.Item>

          <Dropdown.Item onClick={handleOpenPaymentModal}>
            <DollarSign size={16} className="me-2" />
            Gestionar Pagos
          </Dropdown.Item>

          <Dropdown.Item onClick={handleReprintTicket}>
            <Printer size={16} className="me-2" />
            Reimprimir Ticket
          </Dropdown.Item>

          {showRedeemFolioAction && (
            <>
              <Dropdown.Divider />
              <Dropdown.Item onClick={handleOpenRedeemDialog} className="text-success">
                <CheckCircle size={16} className="me-2" />
                Canjear Folio
              </Dropdown.Item>
            </>
          )}

          <Dropdown.Divider />

          <Dropdown.Item>
            <Edit size={16} className="me-2" />
            Editar
          </Dropdown.Item>

          <Dropdown.Item onClick={handleOpenCancelDialog} className="text-danger">
            <X size={16} className="me-2" />
            Cancelar Venta
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      {/* Payment Modal */}
      <PaymentModal
        show={showPaymentModal}
        onHide={handleClosePaymentModal}
        sale={sale}
        onPaymentAdded={handlePaymentAdded}
      />

      {/* Sale Detail Modal */}
      <SaleDetailModal
        show={showDetailModal}
        onHide={handleCloseDetailModal}
        sale={sale}
      />

      {/* Cancel Sale Confirm Dialog */}
      <CancelSaleConfirmDialog
        show={showCancelDialog}
        onHide={handleCloseCancelDialog}
        onConfirm={handleConfirmCancel}
        saleOrderNumber={sale.orderNumber || ""}
        isProcessing={isCanceling}
      />

      {/* Redeem Folio Confirm Dialog */}
      {showRedeemFolioAction && (
        <RedeemFolioConfirmDialog
          show={showRedeemDialog}
          onHide={handleCloseRedeemDialog}
          onConfirm={handleConfirmRedeem}
          saleOrderNumber={sale.orderNumber || ""}
        />
      )}
    </>
  );
};

export default SaleActions;
