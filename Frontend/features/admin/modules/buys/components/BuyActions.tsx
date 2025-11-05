"use client";

import React, { useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { buysService } from "../services/buys";
import { Buy } from "../types";
import BuyModal from "./BuyModal";

interface BuyActionsProps {
  buy: Buy;
  onBuySaved?: () => void;
}

const BuyActions: React.FC<BuyActionsProps> = ({ buy, onBuySaved }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de eliminar esta compra?")) return;

    try {
      setIsDeleting(true);
      await buysService.deleteBuy(buy._id);
      toast.success("Compra eliminada exitosamente");
      onBuySaved?.();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar la compra");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="d-flex justify-content-center gap-1">
        <Button
          variant="light"
          size="sm"
          onClick={() => handleDelete()}
          disabled={isDeleting}
          className="border-0"
          style={{
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            padding: "0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fee",
          }}
          title="Eliminar"
        >
          {isDeleting ? (
            <Spinner animation="border" size="sm" />
          ) : (
            <Trash2 size={16} className="text-danger" />
          )}
        </Button>
      </div>

      <BuyModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        onSuccess={onBuySaved}
        buy={buy}
      />
    </>
  );
};

export default BuyActions;
