import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  X,
  Gift,
  Clock,
  CheckCircle,
  Copy,
  Calendar,
  ShoppingCart,
  Award,
  Package,
  Loader2,
} from "lucide-react";
import { Client } from "../types";
import { clientsService } from "../services/clients";
import { toast } from "react-toastify";

interface ClientReward {
  _id: string;
  reward: {
    _id: string;
    name: string;
    description: string;
    pointsRequired: number;
    rewardValue: number;
    isPercentage: boolean;
  };
  code: string;
  isRedeemed: boolean;
  redeemedAt: string | null;
  usedAt: string | null;
  usedInOrder: any | null;
}

interface ClientRedeemedRewardsModalProps {
  show: boolean;
  onHide: () => void;
  client: Client | null;
}

const ClientRedeemedRewardsModal: React.FC<ClientRedeemedRewardsModalProps> = ({
  show,
  onHide,
  client,
}) => {
  const [rewards, setRewards] = useState<ClientReward[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "used">("pending");

  useEffect(() => {
    if (show && client) {
      loadRewards();
    }
  }, [show, client]);

  const loadRewards = async () => {
    if (!client) return;

    setLoading(true);
    try {
      const response = await clientsService.getClientRewards(client._id);
      if (response.success && response.data) {
        setRewards(response.data);
      }
    } catch (error: any) {
      console.error("Error loading client rewards:", error);
      toast.error("Error al cargar las recompensas del cliente");
    } finally {
      setLoading(false);
    }
  };

  const copyCodeToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado al portapapeles");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pendingRewards = rewards.filter((r) => !r.isRedeemed);
  const usedRewards = rewards.filter((r) => r.isRedeemed);

  if (!client) return null;

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="border-0 pb-0">
          <div className="flex items-center gap-2">
            <div
              className="bg-cyan-500 text-white flex items-center justify-content-center rounded-full"
              style={{ width: "40px", height: "40px" }}
            >
              <Gift size={20} />
            </div>
            <div>
              <DialogTitle className="mb-0 text-lg">Recompensas Reclamadas</DialogTitle>
              <small className="text-muted-foreground">
                {client.name} {client.lastName}
              </small>
            </div>
          </div>
        </DialogHeader>

        <div className="pt-3">
          {loading ? (
            <div className="text-center py-10">
              <Loader2 className="animate-spin text-primary mb-3 mx-auto" size={32} />
              <p className="text-muted-foreground">Cargando recompensas...</p>
            </div>
          ) : rewards.length === 0 ? (
            <div className="text-center py-10">
              <Package size={48} className="text-muted-foreground mb-3 opacity-50 mx-auto" />
              <h6 className="text-muted-foreground">No hay recompensas reclamadas</h6>
              <p className="text-muted-foreground text-sm">
                El cliente aún no ha reclamado ninguna recompensa
              </p>
            </div>
          ) : (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={16} className="text-yellow-500" />
                    <small className="text-muted-foreground">Pendientes de usar</small>
                  </div>
                  <h4 className="mb-0 text-yellow-500 text-xl font-bold">{pendingRewards.length}</h4>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle size={16} className="text-green-500" />
                    <small className="text-muted-foreground">Ya usadas</small>
                  </div>
                  <h4 className="mb-0 text-green-500 text-xl font-bold">{usedRewards.length}</h4>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pending" | "used")}>
                <TabsList className="mb-3">
                  <TabsTrigger value="pending" className="flex items-center gap-2">
                    <Clock size={16} />
                    Pendientes ({pendingRewards.length})
                  </TabsTrigger>
                  <TabsTrigger value="used" className="flex items-center gap-2">
                    <CheckCircle size={16} />
                    Usadas ({usedRewards.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending">
                  {pendingRewards.length === 0 ? (
                    <div className="text-center py-4 bg-muted rounded-lg">
                      <Clock size={32} className="text-muted-foreground mb-2 opacity-50 mx-auto" />
                      <p className="text-muted-foreground mb-0">
                        No hay recompensas pendientes de usar
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {pendingRewards.map((item) => (
                        <div
                          key={item._id}
                          className="border border-yellow-500 bg-yellow-500/10 rounded-lg p-3"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h6 className="mb-1 font-semibold">{item.reward.name}</h6>
                              <p className="text-muted-foreground text-sm mb-2">
                                {item.reward.description}
                              </p>
                              <div className="flex items-center gap-3 mb-2">
                                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-700 border-yellow-500">
                                  {item.reward.isPercentage
                                    ? `${item.reward.rewardValue}% descuento`
                                    : `$${item.reward.rewardValue} de valor`}
                                </Badge>
                                <small className="text-muted-foreground">
                                  <Award size={14} className="mr-1 inline" />
                                  {item.reward.pointsRequired} pts
                                </small>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white rounded-md p-2 mb-2">
                            <div className="flex justify-between items-center">
                              <div>
                                <small className="text-muted-foreground block mb-1">
                                  Código de canje:
                                </small>
                                <h5 className="mb-0 font-mono text-primary text-lg font-bold">
                                  {item.code}
                                </h5>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyCodeToClipboard(item.code)}
                                className="flex items-center gap-1"
                              >
                                <Copy size={14} />
                                Copiar
                              </Button>
                            </div>
                          </div>

                          <small className="text-muted-foreground">
                            <Calendar size={12} className="mr-1 inline" />
                            Reclamado: {formatDate(item.redeemedAt)}
                          </small>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="used">
                  {usedRewards.length === 0 ? (
                    <div className="text-center py-4 bg-muted rounded-lg">
                      <CheckCircle size={32} className="text-muted-foreground mb-2 opacity-50 mx-auto" />
                      <p className="text-muted-foreground mb-0">
                        No hay recompensas usadas aún
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {usedRewards.map((item) => (
                        <div
                          key={item._id}
                          className="border border-green-500 bg-green-500/10 rounded-lg p-3"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h6 className="mb-1 font-semibold">
                                <CheckCircle
                                  size={16}
                                  className="text-green-500 mr-1 inline"
                                />
                                {item.reward.name}
                              </h6>
                              <p className="text-muted-foreground text-sm mb-2">
                                {item.reward.description}
                              </p>
                              <div className="flex items-center gap-3 mb-2">
                                <Badge variant="default" className="bg-green-500">
                                  {item.reward.isPercentage
                                    ? `${item.reward.rewardValue}% aplicado`
                                    : `$${item.reward.rewardValue} aplicado`}
                                </Badge>
                                <small className="text-muted-foreground">
                                  <Award size={14} className="mr-1 inline" />
                                  {item.reward.pointsRequired} pts usados
                                </small>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white rounded-md p-2 mb-2">
                            <div className="grid grid-cols-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Código usado:</span>
                                <div className="font-medium font-mono">
                                  {item.code}
                                </div>
                              </div>
                              {item.usedInOrder && (
                                <div>
                                  <span className="text-muted-foreground">Orden:</span>
                                  <div className="font-medium">
                                    <ShoppingCart size={14} className="mr-1 inline" />
                                    #{item.usedInOrder.orderNumber || item.usedInOrder._id}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>
                              <Calendar size={12} className="mr-1 inline" />
                              Reclamado: {formatDate(item.redeemedAt)}
                            </span>
                            <span>
                              <CheckCircle size={12} className="mr-1 inline" />
                              Usado: {formatDate(item.usedAt)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>

        <DialogFooter className="border-0 pt-0">
          <Button variant="secondary" onClick={onHide}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClientRedeemedRewardsModal;
