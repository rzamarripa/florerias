"use client";

import React, { useState, useEffect } from "react";
import { Gift, Check, Calendar, Percent, DollarSign, ArrowLeft, Key, Package, Loader2 } from "lucide-react";
import { clientsService } from "@/features/admin/modules/clients/services/clients";
import { AvailableRewardItem } from "@/features/admin/modules/clients/types";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface ClientRewardsModalProps {
  show: boolean;
  onHide: () => void;
  clientId: string;
  onSelectReward: (reward: AvailableRewardItem) => void;
}

const ClientRewardsModal: React.FC<ClientRewardsModalProps> = ({
  show,
  onHide,
  clientId,
  onSelectReward,
}) => {
  const [rewards, setRewards] = useState<AvailableRewardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReward, setSelectedReward] = useState<AvailableRewardItem | null>(null);

  // Estado para validacion de codigo
  const [showCodeValidation, setShowCodeValidation] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  useEffect(() => {
    if (show && clientId) {
      fetchRewards();
    }
  }, [show, clientId]);

  useEffect(() => {
    if (!show) {
      setSelectedReward(null);
      setError(null);
      setShowCodeValidation(false);
      setCodeInput("");
      setCodeError(null);
    }
  }, [show]);

  const fetchRewards = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await clientsService.getAvailableRewards(clientId);
      if (response.success) {
        setRewards(response.data);
      } else {
        setError("Error al cargar las recompensas");
      }
    } catch (err: any) {
      console.error("Error al obtener recompensas:", err);
      setError(err.message || "Error al cargar las recompensas");
    } finally {
      setLoading(false);
    }
  };

  // Mostrar paso de validacion de codigo
  const handleProceedToValidation = () => {
    if (selectedReward) {
      setShowCodeValidation(true);
      setCodeInput("");
      setCodeError(null);
    }
  };

  // Volver a la lista de recompensas
  const handleBackToList = () => {
    setShowCodeValidation(false);
    setCodeInput("");
    setCodeError(null);
  };

  // Validar codigo y confirmar
  const handleConfirm = () => {
    if (!selectedReward) return;

    // Validar que el codigo ingresado coincida con el de la recompensa
    if (codeInput.toUpperCase().trim() !== selectedReward.code.toUpperCase()) {
      setCodeError("El codigo ingresado no es correcto");
      return;
    }

    // Codigo valido, aplicar recompensa
    onSelectReward(selectedReward);
    onHide();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isExpired = (validUntil: string | null) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift size={20} className="text-blue-600" />
            Seleccionar Recompensa
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {showCodeValidation && selectedReward ? (
            // Vista de validacion de codigo
            <div className="py-3">
              <div className="text-center mb-4">
                <div className="bg-blue-100 rounded-full p-3 inline-flex mb-3">
                  <Key size={32} className="text-blue-600" />
                </div>
                <h5 className="font-bold mb-2">Ingresa el codigo de la recompensa</h5>
                <p className="text-muted-foreground mb-0">
                  Para aplicar <strong>{selectedReward.reward.name}</strong>
                </p>
                <p className="text-muted-foreground text-sm">
                  {selectedReward.reward.isProducto && selectedReward.reward.productId
                    ? `${selectedReward.reward.productQuantity}x ${selectedReward.reward.productId.nombre}`
                    : selectedReward.reward.isPercentage
                    ? `${selectedReward.reward.rewardValue}% de descuento`
                    : `$${selectedReward.reward.rewardValue.toFixed(2)} de valor`}
                </p>
              </div>

              <div className="mb-3">
                <Input
                  type="text"
                  placeholder="Ingresa el codigo"
                  value={codeInput}
                  onChange={(e) => {
                    setCodeInput(e.target.value.toUpperCase());
                    setCodeError(null);
                  }}
                  className={`text-center py-3 text-lg uppercase ${codeError ? 'border-red-500' : ''}`}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleConfirm();
                    }
                  }}
                />
                {codeError && (
                  <p className="text-red-500 text-sm mt-1">{codeError}</p>
                )}
              </div>
            </div>
          ) : loading ? (
            <div className="text-center py-10">
              <Loader2 className="animate-spin mx-auto text-blue-600" size={32} />
              <p className="mt-2 text-muted-foreground">Cargando recompensas...</p>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : rewards.length === 0 ? (
            <Alert>
              <Gift size={18} className="mr-2" />
              <AlertDescription>No hay recompensas disponibles para usar</AlertDescription>
            </Alert>
          ) : (
            <div className="flex flex-col gap-3">
              {rewards.map((rewardItem) => {
                const expired = isExpired(rewardItem.reward.validUntil);
                const isSelected = selectedReward?._id === rewardItem._id;

                return (
                  <Card
                    key={rewardItem._id}
                    className={`border ${isSelected ? "border-blue-600 border-2" : ""} ${expired ? "opacity-50" : "cursor-pointer hover:border-blue-400"}`}
                    onClick={() => !expired && setSelectedReward(rewardItem)}
                    style={{ cursor: expired ? "not-allowed" : "pointer" }}
                  >
                    <CardContent className="flex justify-between items-center p-4">
                      <div className="flex items-start gap-3">
                        {/* Icono o imagen del producto */}
                        {rewardItem.reward.isProducto && rewardItem.reward.productId?.imagen ? (
                          <img
                            src={rewardItem.reward.productId.imagen}
                            alt={rewardItem.reward.productId.nombre}
                            className={`rounded w-[60px] h-[60px] object-cover ${isSelected ? "border border-blue-600 border-2" : ""}`}
                          />
                        ) : (
                          <div
                            className={`rounded-full p-2 ${isSelected ? "bg-blue-600" : "bg-gray-100"}`}
                            style={{ minWidth: "40px", height: "40px" }}
                          >
                            {isSelected ? (
                              <Check size={24} className="text-white" />
                            ) : rewardItem.reward.isProducto ? (
                              <Package size={24} className={expired ? "text-muted-foreground" : "text-blue-600"} />
                            ) : (
                              <Gift size={24} className={expired ? "text-muted-foreground" : "text-blue-600"} />
                            )}
                          </div>
                        )}
                        <div>
                          <h6 className="mb-1 font-bold flex items-center gap-2">
                            {rewardItem.reward.name}
                            {rewardItem.reward.isProducto && (
                              <Badge variant="secondary">
                                Producto
                              </Badge>
                            )}
                            {expired && (
                              <Badge variant="destructive">
                                Expirada
                              </Badge>
                            )}
                          </h6>
                          {rewardItem.reward.description && (
                            <p className="text-muted-foreground mb-1 text-sm">
                              {rewardItem.reward.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {rewardItem.reward.validFrom && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Calendar size={12} />
                                Desde: {formatDate(rewardItem.reward.validFrom)}
                              </Badge>
                            )}
                            {rewardItem.reward.validUntil && (
                              <Badge
                                variant={expired ? "destructive" : "outline"}
                                className="flex items-center gap-1"
                              >
                                <Calendar size={12} />
                                Hasta: {formatDate(rewardItem.reward.validUntil)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-end">
                        {rewardItem.reward.isProducto && rewardItem.reward.productId ? (
                          // Mostrar informacion del producto
                          <>
                            <div className="text-xl font-bold text-blue-600">
                              {rewardItem.reward.productQuantity}x
                            </div>
                            <small className="text-muted-foreground block max-w-[120px]">
                              {rewardItem.reward.productId.nombre}
                            </small>
                            <small className="text-green-600">
                              Gratis
                            </small>
                          </>
                        ) : (
                          // Mostrar descuento
                          <>
                            <div className="flex items-center gap-1 justify-end">
                              {rewardItem.reward.isPercentage ? (
                                <>
                                  <Percent size={18} className="text-green-600" />
                                  <span className="text-2xl font-bold text-green-600">
                                    {rewardItem.reward.rewardValue}%
                                  </span>
                                </>
                              ) : (
                                <>
                                  <DollarSign size={18} className="text-green-600" />
                                  <span className="text-2xl font-bold text-green-600">
                                    ${rewardItem.reward.rewardValue.toFixed(2)}
                                  </span>
                                </>
                              )}
                            </div>
                            <small className="text-muted-foreground">
                              {rewardItem.reward.isPercentage ? "descuento" : "de valor"}
                            </small>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          {showCodeValidation ? (
            <>
              <Button variant="outline" onClick={handleBackToList}>
                <ArrowLeft size={16} className="mr-1" />
                Volver
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!codeInput.trim()}
              >
                <Check size={16} className="mr-1" />
                Validar y Aplicar
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onHide}>
                Cancelar
              </Button>
              <Button
                onClick={handleProceedToValidation}
                disabled={!selectedReward || isExpired(selectedReward?.reward.validUntil || null)}
              >
                <Check size={16} className="mr-1" />
                Continuar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClientRewardsModal;
