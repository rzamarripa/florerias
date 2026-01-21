"use client";

import React, { useState } from "react";
import { Gift, Check, X, Award, ShoppingBag, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PointsReward } from "../../pointsConfig/types";
import { toast } from "react-toastify";
import digitalCardService from "../services/digitalCardService";

interface RewardsSelectionModalProps {
  show: boolean;
  onHide: () => void;
  client: {
    id: string;
    name: string;
    lastName: string;
    fullName: string;
    clientNumber: string;
    points: number;
  } | null;
  rewards: PointsReward[];
  branchId: string;
  onRedeemSuccess?: (reward: PointsReward) => void;
}

const RewardsSelectionModal: React.FC<RewardsSelectionModalProps> = ({
  show,
  onHide,
  client,
  rewards,
  branchId,
  onRedeemSuccess,
}) => {
  const [selectedReward, setSelectedReward] = useState<PointsReward | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleRedeemReward = async () => {
    if (!selectedReward || !client) return;

    if (client.points < selectedReward.pointsRequired) {
      toast.error("El cliente no tiene suficientes puntos para esta recompensa");
      return;
    }

    try {
      setProcessing(true);
      
      await digitalCardService.processRewardRedemption({
        clientId: client.id,
        rewardId: selectedReward._id,
        branchId: branchId,
      });

      toast.success(
        `Recompensa "${selectedReward.name}" canjeada exitosamente`,
        { position: "top-center" }
      );

      if (onRedeemSuccess) {
        onRedeemSuccess(selectedReward);
      }

      onHide();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 
        error.message || 
        "Error al canjear la recompensa"
      );
    } finally {
      setProcessing(false);
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case "discount":
        return <Gift className="h-5 w-5" />;
      case "product":
        return <ShoppingBag className="h-5 w-5" />;
      default:
        return <Award className="h-5 w-5" />;
    }
  };

  const formatRewardValue = (reward: PointsReward) => {
    if (reward.isPercentage) {
      return `${reward.rewardValue}%`;
    }
    return `$${reward.rewardValue}`;
  };

  const availableRewards = rewards.filter(
    (reward) => client && client.points >= reward.pointsRequired && reward.status
  );

  const unavailableRewards = rewards.filter(
    (reward) => client && (client.points < reward.pointsRequired || !reward.status)
  );

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Seleccionar Recompensa
            </div>
            {client && (
              <Badge variant="default" className="text-lg px-3 py-1">
                {client.points} puntos disponibles
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {client && (
          <div className="bg-muted rounded-lg p-3 mb-4">
            <p className="text-sm">
              <strong>Cliente:</strong> {client.fullName} ({client.clientNumber})
            </p>
          </div>
        )}

        <ScrollArea className="h-[400px] pr-4">
          {availableRewards.length === 0 && unavailableRewards.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No hay recompensas disponibles en este momento
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Recompensas disponibles */}
              {availableRewards.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-green-600">
                    Recompensas Disponibles
                  </h3>
                  <div className="space-y-2">
                    {availableRewards.map((reward) => (
                      <div
                        key={reward._id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedReward?._id === reward._id
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-400"
                        }`}
                        onClick={() => setSelectedReward(reward)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {selectedReward?._id === reward._id ? (
                                <Check className="h-5 w-5 text-primary" />
                              ) : (
                                getRewardIcon(reward.rewardType)
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{reward.name}</h4>
                              {reward.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {reward.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2">
                                <Badge variant="outline">
                                  {reward.pointsRequired} puntos
                                </Badge>
                                <Badge variant="secondary">
                                  {formatRewardValue(reward)} de descuento
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recompensas no disponibles */}
              {unavailableRewards.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-gray-500">
                    Recompensas No Disponibles
                  </h3>
                  <div className="space-y-2 opacity-60">
                    {unavailableRewards.map((reward) => (
                      <div
                        key={reward._id}
                        className="border border-gray-200 rounded-lg p-4 cursor-not-allowed"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getRewardIcon(reward.rewardType)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{reward.name}</h4>
                            {reward.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {reward.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant="outline">
                                {reward.pointsRequired} puntos
                              </Badge>
                              <Badge variant="secondary">
                                {formatRewardValue(reward)} de descuento
                              </Badge>
                              {!reward.status && (
                                <Badge variant="destructive">Inactiva</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onHide} disabled={processing}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            variant="default"
            onClick={handleRedeemReward}
            disabled={!selectedReward || processing}
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Gift className="h-4 w-4 mr-2" />
                Canjear Recompensa
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RewardsSelectionModal;