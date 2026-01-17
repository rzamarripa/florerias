import React, { useState, useEffect } from "react";
import { X, Save, Gift, Loader2 } from "lucide-react";
import {
  PointsReward,
  CreatePointsRewardData,
  UpdatePointsRewardData,
  RewardType,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface PointsRewardModalProps {
  show: boolean;
  onHide: () => void;
  reward?: PointsReward | null;
  onSave: (data: CreatePointsRewardData | UpdatePointsRewardData) => void;
  loading?: boolean;
}

const rewardTypeOptions: { value: RewardType; label: string }[] = [
  { value: "discount", label: "Descuento" },
  { value: "product", label: "Producto" },
  { value: "service", label: "Servicio" },
  { value: "other", label: "Otro" },
];

const defaultFormData: CreatePointsRewardData = {
  name: "",
  description: "",
  pointsRequired: 100,
  rewardType: "discount",
  rewardValue: 10,
  isPercentage: true,
  maxRedemptionsPerClient: 0,
  maxTotalRedemptions: 0,
  validFrom: null,
  validUntil: null,
  branch: "",
  status: true,
};

const PointsRewardModal: React.FC<PointsRewardModalProps> = ({
  show,
  onHide,
  reward,
  onSave,
  loading = false,
}) => {
  const [formData, setFormData] = useState<CreatePointsRewardData>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (reward) {
      setFormData({
        name: reward.name,
        description: reward.description || "",
        pointsRequired: reward.pointsRequired,
        rewardType: reward.rewardType,
        rewardValue: reward.rewardValue,
        isPercentage: reward.isPercentage,
        maxRedemptionsPerClient: reward.maxRedemptionsPerClient,
        maxTotalRedemptions: reward.maxTotalRedemptions,
        validFrom: reward.validFrom ? reward.validFrom.split("T")[0] : null,
        validUntil: reward.validUntil ? reward.validUntil.split("T")[0] : null,
        branch: typeof reward.branch === "string" ? reward.branch : reward.branch._id,
        status: reward.status,
      });
    } else {
      setFormData(defaultFormData);
    }
    setErrors({});
  }, [reward, show]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }
    if (!formData.pointsRequired || formData.pointsRequired < 1) {
      newErrors.pointsRequired = "Los puntos deben ser al menos 1";
    }
    if (formData.rewardValue === undefined || formData.rewardValue < 0) {
      newErrors.rewardValue = "El valor debe ser mayor o igual a 0";
    }
    if (formData.isPercentage && formData.rewardValue && formData.rewardValue > 100) {
      newErrors.rewardValue = "El porcentaje no puede ser mayor a 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const isEditing = !!reward;

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift size={20} className="text-primary" />
            {isEditing ? "Editar Recompensa" : "Nueva Recompensa"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre de la Recompensa <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ej: Descuento del 10%"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>
            </div>
            <div className="md:col-span-4">
              <div className="space-y-2">
                <Label htmlFor="pointsRequired">
                  Puntos Requeridos <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="pointsRequired"
                  type="number"
                  min="1"
                  value={formData.pointsRequired}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pointsRequired: parseInt(e.target.value) || 1,
                    })
                  }
                  className={errors.pointsRequired ? "border-destructive" : ""}
                />
                {errors.pointsRequired && (
                  <p className="text-sm text-destructive">{errors.pointsRequired}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              rows={2}
              placeholder="Descripción opcional de la recompensa"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Tipo de Recompensa</Label>
              <Select
                value={formData.rewardType}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    rewardType: value as RewardType,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {rewardTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rewardValue">
                Valor <span className="text-destructive">*</span>
              </Label>
              <Input
                id="rewardValue"
                type="number"
                min="0"
                step={formData.isPercentage ? "1" : "0.01"}
                value={formData.rewardValue}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rewardValue: parseFloat(e.target.value) || 0,
                  })
                }
                className={errors.rewardValue ? "border-destructive" : ""}
              />
              {errors.rewardValue && (
                <p className="text-sm text-destructive">{errors.rewardValue}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Tipo de Valor</Label>
              <Select
                value={formData.isPercentage ? "percentage" : "fixed"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    isPercentage: value === "percentage",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                  <SelectItem value="fixed">Monto Fijo ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="maxRedemptionsPerClient">Canjes máx. por cliente</Label>
              <Input
                id="maxRedemptionsPerClient"
                type="number"
                min="0"
                placeholder="0 = ilimitado"
                value={formData.maxRedemptionsPerClient}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxRedemptionsPerClient: parseInt(e.target.value) || 0,
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                0 = sin límite por cliente
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxTotalRedemptions">Canjes máx. totales</Label>
              <Input
                id="maxTotalRedemptions"
                type="number"
                min="0"
                placeholder="0 = ilimitado"
                value={formData.maxTotalRedemptions}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxTotalRedemptions: parseInt(e.target.value) || 0,
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                0 = sin límite total
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="validFrom">Válido desde</Label>
              <Input
                id="validFrom"
                type="date"
                value={formData.validFrom || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    validFrom: e.target.value || null,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validUntil">Válido hasta</Label>
              <Input
                id="validUntil"
                type="date"
                value={formData.validUntil || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    validUntil: e.target.value || null,
                  })
                }
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 mt-4">
            <Checkbox
              id="status"
              checked={formData.status}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, status: checked === true })
              }
            />
            <Label htmlFor="status" className="cursor-pointer">
              Recompensa Activa
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
                  {isEditing ? "Actualizar" : "Crear"} Recompensa
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PointsRewardModal;
