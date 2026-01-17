"use client";

import React, { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { buysService } from "../services/buys";
import { Buy } from "../types";
import BuyModal from "./BuyModal";
import { Button } from "@/components/ui/button";

interface BuyActionsProps {
  buy: Buy;
  onBuySaved?: () => void;
}

const BuyActions: React.FC<BuyActionsProps> = ({ buy, onBuySaved }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Estas seguro de eliminar esta compra?")) return;

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
      <div className="flex justify-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDelete()}
          disabled={isDeleting}
          className="h-8 w-8 rounded-full bg-red-50 hover:bg-red-100"
          title="Eliminar"
        >
          {isDeleting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Trash2 size={16} className="text-destructive" />
          )}
        </Button>
      </div>

      <BuyModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSuccess={onBuySaved}
        buy={buy}
      />
    </>
  );
};

export default BuyActions;
