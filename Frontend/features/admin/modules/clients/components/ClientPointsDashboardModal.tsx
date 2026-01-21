import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  X,
  Award,
  TrendingUp,
  Gift,
  ShoppingBag,
  UserPlus,
  RefreshCw,
  Star,
  Check,
  Copy,
  Loader2,
} from "lucide-react";
import { Client, ClientPointsHistory, PointsHistoryReason } from "../types";
import { clientsService } from "../services/clients";
import { pointsRewardService } from "../../pointsConfig/services/pointsReward";
import { PointsReward } from "../../pointsConfig/types";
import { toast } from "react-toastify";

interface ClientPointsDashboardModalProps {
  show: boolean;
  onHide: () => void;
  client: Client | any | null;
  branchId: string | null;
}

const reasonLabels: Record<PointsHistoryReason, string> = {
  purchase_amount: "Compra",
  accumulated_purchases: "Compras acumuladas",
  first_purchase: "Primera compra",
  client_registration: "Registro",
  branch_visit: "Visita a sucursal",
  redemption: "Canje",
  manual_adjustment: "Ajuste manual",
  expiration: "Expiración",
};

const reasonIcons: Record<PointsHistoryReason, React.ReactNode> = {
  purchase_amount: <ShoppingBag size={14} />,
  accumulated_purchases: <TrendingUp size={14} />,
  first_purchase: <Star size={14} />,
  client_registration: <UserPlus size={14} />,
  branch_visit: <Award size={14} />,
  redemption: <Gift size={14} />,
  manual_adjustment: <RefreshCw size={14} />,
  expiration: <X size={14} />,
};

const ClientPointsDashboardModal: React.FC<ClientPointsDashboardModalProps> = ({
  show,
  onHide,
  client,
  branchId,
}) => {
  const [history, setHistory] = useState<ClientPointsHistory[]>([]);
  const [rewards, setRewards] = useState<PointsReward[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [clientPoints, setClientPoints] = useState(0);
  const [redeemingRewardId, setRedeemingRewardId] = useState<string | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [redeemedRewardName, setRedeemedRewardName] = useState<string | null>(null);

  useEffect(() => {
    if (show && client && branchId) {
      loadHistory();
      loadRewards();
    }
  }, [show, client, branchId]);

  const loadHistory = async () => {
    if (!client) return;

    setLoadingHistory(true);
    try {
      const response = await clientsService.getClientPointsHistory(client._id, {
        limit: 50,
        branchId: branchId || undefined,
      });

      if (response.success) {
        setHistory(response.data || []);
        setClientPoints(response.clientPoints || client.points);
      }
    } catch (error: any) {
      console.error("Error loading points history:", error);
      toast.error("Error al cargar el historial de puntos");
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadRewards = async () => {
    if (!branchId) return;

    setLoadingRewards(true);
    try {
      const response = await pointsRewardService.getPointsRewardsByBranch(
        branchId,
        { status: true },
        true // Incluir recompensas globales para que el cliente pueda canjearlas
      );

      if (response.success) {
        setRewards(response.data || []);
      }
    } catch (error: any) {
      console.error("Error loading rewards:", error);
    } finally {
      setLoadingRewards(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateProgress = (pointsRequired: number) => {
    if (pointsRequired <= 0) return 100;
    const progress = (clientPoints / pointsRequired) * 100;
    return Math.min(progress, 100);
  };

  const getPointsRemaining = (pointsRequired: number) => {
    const remaining = pointsRequired - clientPoints;
    return remaining > 0 ? remaining : 0;
  };

  const handleRedeemReward = async (reward: PointsReward) => {
    if (!client || !branchId) return;

    setRedeemingRewardId(reward._id);
    try {
      const response = await clientsService.redeemReward(client._id, {
        rewardId: reward._id,
        branchId,
      });

      if (response.success) {
        setGeneratedCode(response.data.code);
        setRedeemedRewardName(reward.name);
        setClientPoints(response.data.newBalance);
        setShowCodeModal(true);
        loadHistory();
        toast.success("Recompensa reclamada exitosamente");
      }
    } catch (error: any) {
      console.error("Error redeeming reward:", error);
      toast.error(error.message || "Error al reclamar la recompensa");
    } finally {
      setRedeemingRewardId(null);
    }
  };

  const copyCodeToClipboard = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      toast.success("Código copiado al portapapeles");
    }
  };

  if (!client) return null;

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className=" pb-0">
          <div className="flex items-center gap-2">
            <div
              className="bg-primary text-white flex items-center justify-center rounded-full"
              style={{ width: "40px", height: "40px" }}
            >
              <Award size={20} />
            </div>
            <div>
              <DialogTitle className="mb-0 text-lg">Dashboard de Puntos</DialogTitle>
              <small className="text-muted-foreground">
                {client.name} {client.lastName}
              </small>
            </div>
          </div>
        </DialogHeader>

        <div className="pt-3">
          {/* Balance de puntos */}
          <div className="bg-primary/10 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-sm">Balance actual</p>
                <h2 className="mb-0 text-primary font-bold text-3xl">
                  {clientPoints.toLocaleString()} pts
                </h2>
              </div>
              <div
                className="bg-primary text-white rounded-full flex items-center justify-center"
                style={{ width: "60px", height: "60px" }}
              >
                <Star size={28} />
              </div>
            </div>
          </div>

          {/* Progreso hacia Recompensas */}
          <div>
            <h6 className="uppercase text-muted-foreground font-semibold mb-3 flex items-center gap-2 text-xs">
              <Gift size={16} />
              Progreso hacia Recompensas
            </h6>

            <div className="border rounded-lg p-3">
              {loadingRewards ? (
                <div className="text-center py-3">
                  <Loader2 className="animate-spin text-primary mx-auto" size={24} />
                  <p className="mb-0 mt-2 text-sm text-muted-foreground">
                    Cargando recompensas...
                  </p>
                </div>
              ) : rewards.length === 0 ? (
                <div className="text-center py-3">
                  <Gift size={40} className="text-muted-foreground mb-2 opacity-50 mx-auto" />
                  <p className="mb-0 text-muted-foreground">
                    No hay recompensas configuradas
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {rewards.map((reward) => {
                    const progress = calculateProgress(reward.pointsRequired);
                    const remaining = getPointsRemaining(reward.pointsRequired);
                    const isComplete = progress >= 100;
                    const isRedeeming = redeemingRewardId === reward._id;

                    return (
                      <div key={reward._id}>
                        <div className="flex justify-between items-center mb-1">
                          <h6 className="mb-0 text-sm font-medium">{reward.name}</h6>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground text-sm">
                              {isComplete ? (
                                <span className="text-green-500 font-semibold">
                                  Disponible
                                </span>
                              ) : (
                                <>Faltan {remaining} pts</>
                              )}
                            </span>
                            <span
                              className={`font-bold ${
                                isComplete ? "text-green-500" : "text-primary"
                              }`}
                            >
                              {progress.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <Progress
                          value={progress}
                          className={`h-2 ${isComplete ? "[&>div]:bg-green-500" : ""}`}
                        />
                        <div className="flex justify-between items-center mt-1">
                          <small className="text-muted-foreground">
                            {reward.isPercentage
                              ? `${reward.rewardValue}% descuento`
                              : `$${reward.rewardValue} de valor`}
                          </small>
                          <div className="flex items-center gap-2">
                            <small className="text-muted-foreground">
                              {clientPoints} / {reward.pointsRequired} pts
                            </small>
                            {isComplete && (
                              <Button
                                variant="default"
                                size="sm"
                                className="py-0 px-2 bg-green-500 hover:bg-green-600"
                                onClick={() => handleRedeemReward(reward)}
                                disabled={isRedeeming}
                              >
                                {isRedeeming ? (
                                  <Loader2 className="animate-spin" size={14} />
                                ) : (
                                  <>
                                    <Gift size={12} className="mr-1" />
                                    Reclamar
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Historial de puntos */}
          <div className="mb-4 mt-4">
            <h6 className="uppercase text-muted-foreground font-semibold mb-3 flex items-center gap-2 text-xs">
              <TrendingUp size={16} />
              Historial de Puntos
            </h6>

            <div
              className="border rounded-lg overflow-hidden"
              style={{ maxHeight: "250px", overflowY: "auto" }}
            >
              {loadingHistory ? (
                <div className="text-center py-4">
                  <Loader2 className="animate-spin text-primary mx-auto" size={24} />
                  <p className="mb-0 mt-2 text-sm text-muted-foreground">Cargando historial...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-4">
                  <Award size={40} className="text-muted-foreground mb-2 opacity-50 mx-auto" />
                  <p className="mb-0 text-muted-foreground">No hay historial de puntos</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted sticky top-0">
                    <TableRow>
                      <TableHead style={{ width: "35%" }}>Concepto</TableHead>
                      <TableHead style={{ width: "20%" }}>Orden</TableHead>
                      <TableHead className="text-right" style={{ width: "15%" }}>
                        Puntos
                      </TableHead>
                      <TableHead className="text-right" style={{ width: "30%" }}>
                        Fecha
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex items-center justify-center rounded ${
                                item.type === "earned"
                                  ? "bg-green-500/10 text-green-500"
                                  : "bg-red-500/10 text-red-500"
                              }`}
                              style={{ width: "24px", height: "24px" }}
                            >
                              {reasonIcons[item.reason]}
                            </span>
                            <span className="text-sm">
                              {reasonLabels[item.reason] || item.reason}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.orderId ? (
                            <span className="bg-secondary/10 text-secondary text-sm px-2 py-1 rounded">
                              {item.orderId.orderNumber}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`font-semibold ${
                              item.type === "earned"
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {item.type === "earned" ? "+" : "-"}
                            {item.points}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {formatDate(item.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className=" pt-0">
          <Button variant="secondary" onClick={onHide}>
            Cerrar
          </Button>
        </DialogFooter>

        {/* Modal para mostrar el código generado */}
        <Dialog open={showCodeModal} onOpenChange={(open) => !open && setShowCodeModal(false)}>
          <DialogContent className="max-w-sm">
            <DialogHeader className=" pb-0">
              <div className="flex items-center gap-2">
                <div
                  className="bg-green-500 text-white flex items-center justify-center rounded-full"
                  style={{ width: "40px", height: "40px" }}
                >
                  <Check size={20} />
                </div>
                <div>
                  <DialogTitle className="mb-0 text-base">Recompensa Reclamada</DialogTitle>
                  <small className="text-muted-foreground">{redeemedRewardName}</small>
                </div>
              </div>
            </DialogHeader>
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm mb-2">Tu código de canje es:</p>
              <div className="bg-muted rounded-lg p-3 mb-3">
                <h3 className="mb-0 font-mono font-bold text-primary tracking-widest text-2xl">
                  {generatedCode}
                </h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyCodeToClipboard}
                className="flex items-center gap-2 mx-auto"
              >
                <Copy size={14} />
                Copiar código
              </Button>
              <p className="text-muted-foreground text-sm mt-3 mb-0">
                Presenta este código al momento de realizar tu compra para aplicar tu recompensa.
              </p>
            </div>
            <DialogFooter className=" pt-0 justify-center">
              <Button variant="default" className="bg-green-500 hover:bg-green-600" onClick={() => setShowCodeModal(false)}>
                Entendido
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default ClientPointsDashboardModal;
