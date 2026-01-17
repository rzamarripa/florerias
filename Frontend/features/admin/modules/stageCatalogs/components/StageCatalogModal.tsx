"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { X, Loader2 } from "lucide-react";
import { ChromePicker, ColorResult } from "react-color";
import { stageCatalogSchema, StageCatalogFormData } from "../schemas/stageCatalogSchema";
import { stageCatalogsService } from "../services/stageCatalogs";
import { StageCatalog, RGBColor } from "../types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface StageCatalogModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
  stage?: StageCatalog | null;
}

const StageCatalogModal: React.FC<StageCatalogModalProps> = ({
  show,
  onHide,
  onSuccess,
  stage,
}) => {
  const [loading, setLoading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StageCatalogFormData>({
    resolver: zodResolver(stageCatalogSchema),
    defaultValues: {
      name: "",
      abreviation: "",
      stageNumber: 1,
      boardType: "Produccion" as "Produccion" | "Envio",
      color: { r: 102, g: 126, b: 234, a: 1 },
    },
  });

  const currentColor = watch("color");

  useEffect(() => {
    if (show) {
      if (stage) {
        reset({
          name: stage.name,
          abreviation: stage.abreviation,
          stageNumber: stage.stageNumber,
          boardType: stage.boardType,
          color: stage.color,
        });
      } else {
        reset({
          name: "",
          abreviation: "",
          stageNumber: 1,
          boardType: "Produccion" as "Produccion" | "Envio",
          color: { r: 102, g: 126, b: 234, a: 1 },
        });
      }
    }
  }, [show, stage, reset]);

  const handleColorChange = (color: ColorResult) => {
    setValue("color", {
      r: color.rgb.r,
      g: color.rgb.g,
      b: color.rgb.b,
      a: color.rgb.a || 1,
    });
  };

  const onSubmit = async (data: StageCatalogFormData) => {
    try {
      setLoading(true);

      if (stage) {
        await stageCatalogsService.updateStageCatalog(stage._id, {
          name: data.name,
          abreviation: data.abreviation,
          stageNumber: data.stageNumber,
          boardType: data.boardType,
          color: data.color,
        });
        toast.success("Etapa actualizada exitosamente");
      } else {
        await stageCatalogsService.createStageCatalog(data);
        toast.success("Etapa creada exitosamente");
      }

      onSuccess();
      onHide();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar la etapa");
      console.error("Error saving stage:", error);
    } finally {
      setLoading(false);
    }
  };

  const rgbaToString = (color: RGBColor): string => {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a || 1})`;
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{stage ? "Editar Etapa" : "Nueva Etapa"}</DialogTitle>
          <DialogDescription>
            {stage
              ? "Actualiza la información de la etapa"
              : "Completa los datos de la nueva etapa"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre de la Etapa <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="name"
                    type="text"
                    placeholder="Ej: En Proceso, Completado, Pendiente"
                    className={errors.name ? "border-destructive" : ""}
                  />
                )}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Abreviación */}
              <div className="space-y-2">
                <Label htmlFor="abreviation">
                  Abreviación <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="abreviation"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="abreviation"
                      type="text"
                      placeholder="Ej: EP, COM, PEN"
                      className={`uppercase ${errors.abreviation ? "border-destructive" : ""}`}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  )}
                />
                {errors.abreviation && (
                  <p className="text-sm text-destructive">{errors.abreviation.message}</p>
                )}
              </div>

              {/* Número de Etapa */}
              <div className="space-y-2">
                <Label htmlFor="stageNumber">
                  Número de Etapa <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="stageNumber"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="stageNumber"
                      type="number"
                      min="1"
                      placeholder="Ej: 1, 2, 3"
                      className={errors.stageNumber ? "border-destructive" : ""}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  )}
                />
                {errors.stageNumber && (
                  <p className="text-sm text-destructive">{errors.stageNumber.message}</p>
                )}
              </div>
            </div>

            {/* Tipo de Tablero */}
            <div className="space-y-2">
              <Label htmlFor="boardType">
                Tipo de Tablero <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="boardType"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className={errors.boardType ? "border-destructive" : ""}>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Produccion">Producción</SelectItem>
                      <SelectItem value="Envio">Envío</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.boardType && (
                <p className="text-sm text-destructive">{errors.boardType.message}</p>
              )}
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>
                Color <span className="text-destructive">*</span>
              </Label>
              <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-3 w-full p-3 border rounded-md bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-md border-2 border-border"
                      style={{
                        backgroundColor: currentColor
                          ? rgbaToString(currentColor)
                          : "hsl(var(--primary))",
                      }}
                    />
                    <div className="text-left">
                      <div className="font-medium">
                        {currentColor
                          ? `RGB(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`
                          : "Selecciona un color"}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Haz clic para cambiar el color
                      </p>
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <ChromePicker
                    color={currentColor}
                    onChange={handleColorChange}
                    disableAlpha={false}
                  />
                </PopoverContent>
              </Popover>
              {errors.color && (
                <p className="text-sm text-destructive">{errors.color.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onHide}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : stage ? (
                "Actualizar Etapa"
              ) : (
                "Crear Etapa"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StageCatalogModal;
