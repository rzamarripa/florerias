"use client";

import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Eye, Edit, X, DollarSign, Printer, CheckCircle } from "lucide-react";
import { Sale } from "../types";
import PaymentModal from "./PaymentModal";
import SaleDetailModal from "./SaleDetailModal";
import CancelSaleConfirmDialog from "./CancelSaleConfirmDialog";
import RedeemFolioConfirmDialog from "./RedeemFolioConfirmDialog";
import EditSaleModal from "./EditSaleModal";
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
  const [showEditModal, setShowEditModal] = useState(false);
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

  const handleOpenEditModal = () => {
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
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

  const handleConfirmCancel = async (reason: string) => {
    try {
      setIsCanceling(true);
      await salesService.updateOrderStatus(sale._id, "cancelado", reason);
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleOpenDetailModal}>
            <Eye className="h-4 w-4 mr-2" />
            Ver Detalles
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleOpenPaymentModal}>
            <DollarSign className="h-4 w-4 mr-2" />
            Gestionar Pagos
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleReprintTicket}>
            <Printer className="h-4 w-4 mr-2" />
            Reimprimir Ticket
          </DropdownMenuItem>

          {showRedeemFolioAction && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleOpenRedeemDialog} className="text-green-600">
                <CheckCircle className="h-4 w-4 mr-2" />
                Canjear Folio
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleOpenEditModal}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleOpenCancelDialog} variant="destructive">
            <X className="h-4 w-4 mr-2" />
            Cancelar Venta
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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

      {/* Edit Sale Modal */}
      <EditSaleModal
        show={showEditModal}
        onHide={handleCloseEditModal}
        sale={sale}
        onSaleUpdated={onSaleUpdated}
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
