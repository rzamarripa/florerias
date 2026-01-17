import React, { useState, useEffect } from "react";
import { X, Save, Award, Loader2 } from "lucide-react";
import {
  PointsConfig,
  CreatePointsConfigData,
  UpdatePointsConfigData,
} from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

interface PointsConfigModalProps {
  show: boolean;
  onHide: () => void;
  config?: PointsConfig | null;
  onSave: (data: CreatePointsConfigData | UpdatePointsConfigData) => void;
  loading?: boolean;
}

const defaultFormData: CreatePointsConfigData = {
  pointsPerPurchaseAmount: {
    enabled: true,
    amount: 100,
    points: 1,
  },
  pointsPerAccumulatedPurchases: {
    enabled: false,
    purchasesRequired: 5,
    points: 10,
  },
  pointsForFirstPurchase: {
    enabled: true,
    points: 5,
  },
  pointsForClientRegistration: {
    enabled: true,
    points: 10,
  },
  pointsForBranchVisit: {
    enabled: false,
    points: 2,
    maxVisitsPerDay: 1,
  },
  branch: "",
  status: true,
};

const PointsConfigModal: React.FC<PointsConfigModalProps> = ({
  show,
  onHide,
  config,
  onSave,
  loading = false,
}) => {
  const [formData, setFormData] = useState<CreatePointsConfigData>(defaultFormData);

  useEffect(() => {
    if (config) {
      setFormData({
        pointsPerPurchaseAmount: config.pointsPerPurchaseAmount,
        pointsPerAccumulatedPurchases: config.pointsPerAccumulatedPurchases,
        pointsForFirstPurchase: config.pointsForFirstPurchase,
        pointsForClientRegistration: config.pointsForClientRegistration,
        pointsForBranchVisit: config.pointsForBranchVisit,
        branch: typeof config.branch === "string" ? config.branch : config.branch._id,
        status: config.status,
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [config, show]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const isEditing = !!config;

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award size={20} className="text-primary" />
            {isEditing ? "Editar Configuración de Puntos" : "Nueva Configuración de Puntos"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {/* Puntos por Total de Compra */}
          <Card className="mb-3">
            <CardHeader className="bg-muted/50 py-2 px-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="purchaseAmountEnabled"
                  checked={formData.pointsPerPurchaseAmount?.enabled}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      pointsPerPurchaseAmount: {
                        ...formData.pointsPerPurchaseAmount!,
                        enabled: checked,
                      },
                    })
                  }
                />
                <Label htmlFor="purchaseAmountEnabled" className="font-semibold cursor-pointer">
                  Puntos por Total de Compra
                </Label>
              </div>
            </CardHeader>
            {formData.pointsPerPurchaseAmount?.enabled && (
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchaseAmount" className="text-sm">Por cada $ (monto)</Label>
                    <Input
                      id="purchaseAmount"
                      type="number"
                      min="1"
                      value={formData.pointsPerPurchaseAmount?.amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pointsPerPurchaseAmount: {
                            ...formData.pointsPerPurchaseAmount!,
                            amount: parseInt(e.target.value) || 1,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchasePoints" className="text-sm">Puntos a otorgar</Label>
                    <Input
                      id="purchasePoints"
                      type="number"
                      min="0"
                      value={formData.pointsPerPurchaseAmount?.points}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pointsPerPurchaseAmount: {
                            ...formData.pointsPerPurchaseAmount!,
                            points: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Ejemplo: Por cada ${formData.pointsPerPurchaseAmount?.amount} de compra, el cliente recibe {formData.pointsPerPurchaseAmount?.points} punto(s).
                </p>
              </CardContent>
            )}
          </Card>

          {/* Puntos por Compras Acumuladas */}
          <Card className="mb-3">
            <CardHeader className="bg-muted/50 py-2 px-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="accumulatedPurchasesEnabled"
                  checked={formData.pointsPerAccumulatedPurchases?.enabled}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      pointsPerAccumulatedPurchases: {
                        ...formData.pointsPerAccumulatedPurchases!,
                        enabled: checked,
                      },
                    })
                  }
                />
                <Label htmlFor="accumulatedPurchasesEnabled" className="font-semibold cursor-pointer">
                  Puntos por Compras Acumuladas
                </Label>
              </div>
            </CardHeader>
            {formData.pointsPerAccumulatedPurchases?.enabled && (
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchasesRequired" className="text-sm">Compras requeridas</Label>
                    <Input
                      id="purchasesRequired"
                      type="number"
                      min="1"
                      value={formData.pointsPerAccumulatedPurchases?.purchasesRequired}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pointsPerAccumulatedPurchases: {
                            ...formData.pointsPerAccumulatedPurchases!,
                            purchasesRequired: parseInt(e.target.value) || 1,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accumulatedPoints" className="text-sm">Puntos a otorgar</Label>
                    <Input
                      id="accumulatedPoints"
                      type="number"
                      min="0"
                      value={formData.pointsPerAccumulatedPurchases?.points}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pointsPerAccumulatedPurchases: {
                            ...formData.pointsPerAccumulatedPurchases!,
                            points: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Ejemplo: Por cada {formData.pointsPerAccumulatedPurchases?.purchasesRequired} compras acumuladas, el cliente recibe {formData.pointsPerAccumulatedPurchases?.points} punto(s).
                </p>
              </CardContent>
            )}
          </Card>

          {/* Puntos por Primera Venta */}
          <Card className="mb-3">
            <CardHeader className="bg-muted/50 py-2 px-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="firstPurchaseEnabled"
                  checked={formData.pointsForFirstPurchase?.enabled}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      pointsForFirstPurchase: {
                        ...formData.pointsForFirstPurchase!,
                        enabled: checked,
                      },
                    })
                  }
                />
                <Label htmlFor="firstPurchaseEnabled" className="font-semibold cursor-pointer">
                  Puntos por Primera Compra
                </Label>
              </div>
            </CardHeader>
            {formData.pointsForFirstPurchase?.enabled && (
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstPurchasePoints" className="text-sm">Puntos a otorgar</Label>
                    <Input
                      id="firstPurchasePoints"
                      type="number"
                      min="0"
                      value={formData.pointsForFirstPurchase?.points}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pointsForFirstPurchase: {
                            ...formData.pointsForFirstPurchase!,
                            points: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Puntos de bienvenida al realizar la primera compra.
                </p>
              </CardContent>
            )}
          </Card>

          {/* Puntos por Registro de Cliente */}
          <Card className="mb-3">
            <CardHeader className="bg-muted/50 py-2 px-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="clientRegistrationEnabled"
                  checked={formData.pointsForClientRegistration?.enabled}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      pointsForClientRegistration: {
                        ...formData.pointsForClientRegistration!,
                        enabled: checked,
                      },
                    })
                  }
                />
                <Label htmlFor="clientRegistrationEnabled" className="font-semibold cursor-pointer">
                  Puntos por Registro de Cliente
                </Label>
              </div>
            </CardHeader>
            {formData.pointsForClientRegistration?.enabled && (
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="registrationPoints" className="text-sm">Puntos a otorgar</Label>
                    <Input
                      id="registrationPoints"
                      type="number"
                      min="0"
                      value={formData.pointsForClientRegistration?.points}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pointsForClientRegistration: {
                            ...formData.pointsForClientRegistration!,
                            points: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Puntos al registrarse como cliente nuevo.
                </p>
              </CardContent>
            )}
          </Card>

          {/* Puntos por Visita a Sucursal */}
          <Card className="mb-3">
            <CardHeader className="bg-muted/50 py-2 px-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="branchVisitEnabled"
                  checked={formData.pointsForBranchVisit?.enabled}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      pointsForBranchVisit: {
                        ...formData.pointsForBranchVisit!,
                        enabled: checked,
                      },
                    })
                  }
                />
                <Label htmlFor="branchVisitEnabled" className="font-semibold cursor-pointer">
                  Puntos por Visita a Sucursal
                </Label>
              </div>
            </CardHeader>
            {formData.pointsForBranchVisit?.enabled && (
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="visitPoints" className="text-sm">Puntos a otorgar</Label>
                    <Input
                      id="visitPoints"
                      type="number"
                      min="0"
                      value={formData.pointsForBranchVisit?.points}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pointsForBranchVisit: {
                            ...formData.pointsForBranchVisit!,
                            points: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxVisitsPerDay" className="text-sm">Visitas máximas por día</Label>
                    <Input
                      id="maxVisitsPerDay"
                      type="number"
                      min="1"
                      value={formData.pointsForBranchVisit?.maxVisitsPerDay}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pointsForBranchVisit: {
                            ...formData.pointsForBranchVisit!,
                            maxVisitsPerDay: parseInt(e.target.value) || 1,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Limita cuántas veces al día puede recibir puntos por visita.
                </p>
              </CardContent>
            )}
          </Card>

          {/* Estado */}
          <div className="flex items-center space-x-2 mt-4">
            <Checkbox
              id="configStatus"
              checked={formData.status}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  status: checked === true,
                })
              }
            />
            <Label htmlFor="configStatus" className="cursor-pointer">
              Configuración Activa
            </Label>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" type="button" onClick={onHide} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isEditing ? "Actualizar" : "Crear"} Configuración
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PointsConfigModal;
