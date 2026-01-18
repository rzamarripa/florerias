"use client";

import {
  DollarSign,
  Layers,
  Gift,
  UserPlus,
  MapPin,
  Plus,
  Settings,
  Award,
  Edit2,
  Percent,
  Package,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Loader2,
} from "lucide-react";
import React, { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { pointsConfigService } from "./services/pointsConfig";
import { pointsRewardService } from "./services/pointsReward";
import {
  PointsConfig,
  CreatePointsConfigData,
  UpdatePointsConfigData,
  PointsReward,
  CreatePointsRewardData,
  UpdatePointsRewardData,
} from "./types";
import PointsConfigModal from "./components/PointsConfigModal";
import PointsRewardModal from "./components/PointsRewardModal";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { branchesService } from "../branches/services/branches";
import { Branch } from "../branches/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PointsConfigPage: React.FC = () => {
  const router = useRouter();
  const [config, setConfig] = useState<PointsConfig | null>(null);
  const [rewards, setRewards] = useState<PointsReward[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [rewardsLoading, setRewardsLoading] = useState<boolean>(false);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [selectedReward, setSelectedReward] = useState<PointsReward | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [managerBranch, setManagerBranch] = useState<Branch | null>(null);
  const { user } = useUserSessionStore();
  const { activeBranch } = useActiveBranchStore();
  const { hasRole } = useUserRoleStore();
  const isManager = hasRole("Gerente");
  const isAdmin = hasRole("Administrador") || hasRole("Admin");

  // Separar recompensas por tipo: productos (isProducto=true) vs otras
  const { productRewards, otherRewards } = useMemo(() => {
    const productRewards = rewards.filter((r) => r.isProducto === true);
    const otherRewards = rewards.filter((r) => r.isProducto !== true);
    return { productRewards, otherRewards };
  }, [rewards]);

  // Cargar sucursal del gerente si aplica
  const loadManagerBranch = async () => {
    try {
      const response = await branchesService.getUserBranches();
      if (response.success && response.data && response.data.length > 0) {
        const branch = response.data[0]; // El gerente solo debe tener una sucursal
        setManagerBranch(branch);
        setBranchId(branch._id);
        console.log("🔍 [PointsConfig] Sucursal del gerente cargada:", branch.branchName);
      } else {
        toast.error("No se encontró una sucursal asignada para el gerente");
      }
    } catch (error: any) {
      console.error("Error al cargar sucursal del gerente:", error);
      toast.error(error.message || "Error al cargar la sucursal del gerente");
    }
  };

  // Determinar el branchId según el rol del usuario
  useEffect(() => {
    if (isManager) {
      loadManagerBranch();
    } else if (isAdmin && activeBranch) {
      setBranchId(activeBranch._id);
      console.log("🔍 [PointsConfig] Usando sucursal activa del admin:", activeBranch.branchName);
    }
  }, [isManager, isAdmin, activeBranch]);

  const loadConfig = async () => {
    if (!branchId) return;

    try {
      setLoading(true);
      const response = await pointsConfigService.getPointsConfigByBranch(branchId);
      if (response.data) {
        setConfig(response.data);
      }
    } catch (error: any) {
      if (error.message?.includes("no encontrada")) {
        setConfig(null);
      } else {
        console.error("Error loading config:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadRewards = async () => {
    if (!branchId) return;

    try {
      setRewardsLoading(true);
      const response = await pointsRewardService.getPointsRewardsByBranch(branchId);
      if (response.data) {
        setRewards(response.data);
      }
    } catch (error: any) {
      console.error("Error loading rewards:", error);
    } finally {
      setRewardsLoading(false);
    }
  };

  useEffect(() => {
    if (branchId) {
      loadConfig();
      loadRewards();
    }
  }, [branchId]);

  const handleCreateOrEditConfig = () => {
    setShowConfigModal(true);
  };

  const handleSaveConfig = async (data: CreatePointsConfigData | UpdatePointsConfigData) => {
    try {
      setModalLoading(true);
      if (config) {
        await pointsConfigService.updatePointsConfig(config._id, data);
        toast.success("Configuración actualizada exitosamente");
      } else {
        // Validar que hay una sucursal disponible
        const branchToUse = isManager ? managerBranch?._id : branchId;

        if (!branchToUse) {
          toast.error(
            isManager
              ? "No se encontró una sucursal asignada para el gerente"
              : "No se ha seleccionado una sucursal"
          );
          return;
        }

        const configData = { ...data, branch: branchToUse } as CreatePointsConfigData;
        await pointsConfigService.createPointsConfig(configData);
        toast.success("Configuración creada exitosamente");
      }
      setShowConfigModal(false);
      loadConfig();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar la configuración");
    } finally {
      setModalLoading(false);
    }
  };

  const handleCreateReward = () => {
    setSelectedReward(null);
    setShowRewardModal(true);
  };

  const handleEditReward = (reward: PointsReward) => {
    setSelectedReward(reward);
    setShowRewardModal(true);
  };

  const handleSaveReward = async (data: CreatePointsRewardData | UpdatePointsRewardData) => {
    try {
      setModalLoading(true);
      if (selectedReward) {
        await pointsRewardService.updatePointsReward(selectedReward._id, data);
        toast.success("Recompensa actualizada exitosamente");
      } else {
        // Validar que hay una sucursal disponible
        const branchToUse = isManager ? managerBranch?._id : branchId;

        if (!branchToUse) {
          toast.error(
            isManager
              ? "No se encontró una sucursal asignada para el gerente"
              : "No se ha seleccionado una sucursal"
          );
          return;
        }

        const rewardData = { ...data, branch: branchToUse } as CreatePointsRewardData;
        await pointsRewardService.createPointsReward(rewardData);
        toast.success("Recompensa creada exitosamente");
      }
      setShowRewardModal(false);
      loadRewards();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar la recompensa");
    } finally {
      setModalLoading(false);
    }
  };

  const renderStatCard = (
    icon: React.ReactNode,
    value: string | number,
    label: string,
    enabled: boolean,
    bgColor: string,
    detail?: string
  ) => (
    <div>
      <Card className="shadow-sm h-full">
        <CardContent className="p-4">
          <div className="flex items-center">
            <div
              className="flex items-center justify-center rounded-full mr-3"
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: bgColor,
              }}
            >
              {icon}
            </div>
            <div className="flex-grow">
              <h2 className="mb-0 font-bold text-2xl">
                {value}
              </h2>
              <p className="text-muted-foreground mb-0 text-sm">{label}</p>
            </div>
            <div>
              <Badge
                variant={enabled ? "default" : "secondary"}
                className={enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}
              >
                {enabled ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </div>
          {detail && (
            <div className="mt-2 pt-2 border-t">
              <small className="text-muted-foreground">{detail}</small>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const getRewardIcon = (type: string) => {
    switch (type) {
      case "discount":
        return <Percent size={24} className="text-white" />;
      case "product":
        return <Package size={24} className="text-white" />;
      case "service":
        return <Sparkles size={24} className="text-white" />;
      default:
        return <Gift size={24} className="text-white" />;
    }
  };

  const getRewardColor = () => {
    return "#D4AF37";
  };

  const renderRewardCard = (reward: PointsReward) => (
    <div key={reward._id}>
      <Card className="shadow-sm h-full">
        <CardContent className="p-4">
          <div className="flex items-center">
            <div
              className="flex items-center justify-center rounded-full mr-3"
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: getRewardColor(),
              }}
            >
              {getRewardIcon(reward.rewardType)}
            </div>
            <div className="flex-grow">
              <h2 className="mb-0 font-bold text-xl">
                {reward.pointsRequired} pts
              </h2>
              <p className="text-muted-foreground mb-0 text-sm truncate max-w-[150px]">
                {reward.name}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge
                variant={reward.status ? "default" : "secondary"}
                className={reward.status ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}
              >
                {reward.status ? "Activo" : "Inactivo"}
              </Badge>
              <Button
                variant="link"
                size="sm"
                className="p-0 text-muted-foreground"
                onClick={() => handleEditReward(reward)}
                title="Editar"
              >
                <Edit2 size={14} />
              </Button>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t">
            <small className="text-muted-foreground block">
              {reward.isPercentage
                ? `${reward.rewardValue}% de descuento`
                : `$${reward.rewardValue} de valor`}
            </small>
            {reward.description && (
              <small className="text-muted-foreground block mt-1 opacity-70">
                {reward.description}
              </small>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Mensajes de advertencia para sucursal */}
      {!isManager && !activeBranch && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-3">
          <strong>Advertencia:</strong> No hay sucursal activa seleccionada.
          Por favor, selecciona una sucursal desde el selector de sucursales en
          la parte superior para poder configurar puntos.
        </div>
      )}

      {isManager && !managerBranch && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-3">
          <strong>Advertencia:</strong> No se encontró una sucursal asignada para tu usuario.
          Por favor, contacta al administrador.
        </div>
      )}

      {/* Header con botón de configuración */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h5 className="mb-1 font-medium">
            {isManager
              ? (managerBranch?.branchName || "Cargando sucursal...")
              : (activeBranch?.branchName || "Sucursal")}
          </h5>
          <small className="text-muted-foreground">
            {config ? "Configuración activa" : "Sin configuración"}
          </small>
        </div>
        <Button
          onClick={handleCreateOrEditConfig}
          className="flex items-center gap-2"
          disabled={isManager ? !managerBranch : !branchId}
          title={
            isManager && !managerBranch
              ? "No hay sucursal asignada"
              : !branchId
              ? "Selecciona una sucursal primero"
              : ""
          }
        >
          {config ? <Settings size={16} /> : <Plus size={16} />}
          {config ? "Editar Configuración" : "Nueva Configuración"}
        </Button>
      </div>

      {/* Sección: Acumulación de Puntos */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Award size={20} className="text-primary" />
          <h6 className="mb-0 uppercase text-muted-foreground font-semibold tracking-wide text-sm">
            Acumulación de Puntos
          </h6>
        </div>

        {!config ? (
          <Card className="shadow-sm">
            <CardContent className="text-center py-10">
              <Award size={64} className="text-muted-foreground mb-3 opacity-50 mx-auto" />
              <h5 className="text-muted-foreground">No hay configuración de puntos</h5>
              <p className="text-muted-foreground mb-4">
                Crea una configuración para definir cómo se acumulan los puntos
              </p>
              <Button
                onClick={handleCreateOrEditConfig}
                className="flex items-center gap-2 mx-auto"
                disabled={isManager ? !managerBranch : !branchId}
              >
                <Plus size={16} />
                Crear Configuración
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {renderStatCard(
              <DollarSign size={24} className="text-white" />,
              config.pointsPerPurchaseAmount.enabled
                ? `${config.pointsPerPurchaseAmount.points} pts`
                : "—",
              "Por Total de Compra",
              config.pointsPerPurchaseAmount.enabled,
              "#1ab394",
              config.pointsPerPurchaseAmount.enabled
                ? `Por cada $${config.pointsPerPurchaseAmount.amount} de compra`
                : undefined
            )}

            {renderStatCard(
              <Layers size={24} className="text-white" />,
              config.pointsPerAccumulatedPurchases.enabled
                ? `${config.pointsPerAccumulatedPurchases.points} pts`
                : "—",
              "Compras Acumuladas",
              config.pointsPerAccumulatedPurchases.enabled,
              "#f8ac59",
              config.pointsPerAccumulatedPurchases.enabled
                ? `Por cada ${config.pointsPerAccumulatedPurchases.purchasesRequired} compras`
                : undefined
            )}

            {renderStatCard(
              <Gift size={24} className="text-white" />,
              config.pointsForFirstPurchase.enabled
                ? `${config.pointsForFirstPurchase.points} pts`
                : "—",
              "Primera Compra",
              config.pointsForFirstPurchase.enabled,
              "#ed5565",
              config.pointsForFirstPurchase.enabled
                ? "Bono de bienvenida"
                : undefined
            )}

            {renderStatCard(
              <UserPlus size={24} className="text-white" />,
              config.pointsForClientRegistration.enabled
                ? `${config.pointsForClientRegistration.points} pts`
                : "—",
              "Registro de Cliente",
              config.pointsForClientRegistration.enabled,
              "#1c84c6",
              config.pointsForClientRegistration.enabled
                ? "Al registrarse como cliente"
                : undefined
            )}

            {renderStatCard(
              <MapPin size={24} className="text-white" />,
              config.pointsForBranchVisit.enabled
                ? `${config.pointsForBranchVisit.points} pts`
                : "—",
              "Visita a Sucursal",
              config.pointsForBranchVisit.enabled,
              "#9b59b6",
              config.pointsForBranchVisit.enabled
                ? `Máx. ${config.pointsForBranchVisit.maxVisitsPerDay} visita(s)/día`
                : undefined
            )}
          </div>
        )}
      </div>

      {/* Seccion: Recompensas Canjeables */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Gift size={20} className="text-primary" />
            <h6 className="mb-0 uppercase text-muted-foreground font-semibold tracking-wide text-sm">
              Recompensas Canjeables
            </h6>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateReward}
            className="flex items-center gap-2"
            disabled={isManager ? !managerBranch : !branchId}
            title={
              isManager && !managerBranch
                ? "No hay sucursal asignada"
                : !branchId
                ? "Selecciona una sucursal primero"
                : ""
            }
          >
            <Plus size={14} />
            Nueva Recompensa
          </Button>
        </div>

        {rewardsLoading ? (
          <div className="text-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
          </div>
        ) : otherRewards.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="text-center py-10">
              <Gift size={64} className="text-muted-foreground mb-3 opacity-50 mx-auto" />
              <h5 className="text-muted-foreground">No hay recompensas configuradas</h5>
              <p className="text-muted-foreground mb-4">
                Crea recompensas que los clientes puedan canjear con sus puntos
              </p>
              <Button
                variant="outline"
                onClick={handleCreateReward}
                className="flex items-center gap-2 mx-auto"
                disabled={isManager ? !managerBranch : !branchId}
              >
                <Plus size={16} />
                Crear Recompensa
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {otherRewards.map((reward) => renderRewardCard(reward))}
          </div>
        )}
      </div>

      {/* Seccion: Productos como Recompensa */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBag size={20} className="text-primary" />
          <h6 className="mb-0 uppercase text-muted-foreground font-semibold tracking-wide text-sm">
            Productos como Recompensa
          </h6>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: "56px",
                    height: "56px",
                    backgroundColor: "#6c5ce7",
                  }}
                >
                  <ShoppingBag size={28} className="text-white" />
                </div>
                <div>
                  <h5 className="mb-1 font-semibold">Gestión de Productos</h5>
                  <p className="text-muted-foreground mb-0 text-sm">
                    {rewardsLoading ? (
                      "Cargando..."
                    ) : productRewards.length === 0 ? (
                      "No hay productos configurados como recompensa"
                    ) : (
                      `${productRewards.length} producto(s) configurado(s) como recompensa`
                    )}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => router.push("/panel/productos-recompensa")}
                className="flex items-center gap-2"
              >
                <ShoppingBag size={16} />
                Ver Productos
                <ArrowRight size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <PointsConfigModal
        show={showConfigModal}
        onHide={() => setShowConfigModal(false)}
        config={config}
        onSave={handleSaveConfig}
        loading={modalLoading}
      />

      <PointsRewardModal
        show={showRewardModal}
        onHide={() => setShowRewardModal(false)}
        reward={selectedReward}
        onSave={handleSaveReward}
        loading={modalLoading}
      />
    </div>
  );
};

export default PointsConfigPage;
