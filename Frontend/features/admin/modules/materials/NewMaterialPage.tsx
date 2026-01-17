"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, ArrowLeft, Package2, DollarSign, Loader2, X } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import { materialsService } from "./services/materials";
import { unitsService } from "../units/services/units";
import { CreateMaterialData } from "./types";
import { Unit } from "../units/types";

const NewMaterialPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const materialId = params?.id as string;
  const isEditing = !!materialId;

  const [formData, setFormData] = useState<CreateMaterialData>({
    name: "",
    unit: "",
    price: 0,
    cost: 0,
    piecesPerPackage: 1,
    description: "",
    status: true,
  });

  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar unidades
  useEffect(() => {
    loadUnits();
  }, []);

  // Cargar material si estamos editando
  useEffect(() => {
    if (isEditing) {
      loadMaterial();
    }
  }, [materialId]);

  const loadUnits = async () => {
    try {
      setLoadingUnits(true);
      const response = await unitsService.getAllUnits({ status: true, limit: 1000 });
      setUnits(response.data);
    } catch (err: any) {
      toast.error("Error al cargar las unidades");
      console.error("Error loading units:", err);
    } finally {
      setLoadingUnits(false);
    }
  };

  const loadMaterial = async () => {
    try {
      setLoading(true);
      const response = await materialsService.getMaterialById(materialId);
      const material = response.data;
      setFormData({
        name: material.name,
        unit: material.unit._id,
        price: material.price,
        cost: material.cost,
        piecesPerPackage: material.piecesPerPackage,
        description: material.description,
        status: material.status,
      });
    } catch (err: any) {
      toast.error("Error al cargar el material");
      console.error("Error loading material:", err);
      router.push("/catalogos/materiales");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!formData.name.trim()) {
      setError("El nombre es requerido");
      return;
    }

    if (!formData.unit) {
      setError("La unidad es requerida");
      return;
    }

    if (formData.price < 0) {
      setError("El precio no puede ser negativo");
      return;
    }

    if (formData.cost < 0) {
      setError("El costo no puede ser negativo");
      return;
    }

    try {
      setLoading(true);

      if (isEditing) {
        await materialsService.updateMaterial(materialId, formData);
        toast.success("Material actualizado exitosamente");
      } else {
        await materialsService.createMaterial(formData);
        toast.success("Material creado exitosamente");
      }

      router.push("/catalogos/materiales");
    } catch (err: any) {
      setError(err.message || "Error al guardar el material");
      toast.error(err.message || "Error al guardar el material");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/catalogos/materiales");
  };

  // Funcion para formatear numeros con separacion de miles
  const formatNumber = (num: number): string => {
    return num.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Calcular ganancia y margen
  const ganancia = formData.price - formData.cost;
  const margen = formData.price > 0 ? (ganancia / formData.price) * 100 : 0;

  if (loading && isEditing) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="new-material-page">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              <X size={16} />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Informacion General */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardHeader className="bg-white border-0 py-3">
            <div className="flex items-center gap-2">
              <Package2 size={20} className="text-primary" />
              <h5 className="mb-0 font-bold text-lg">Informacion del Material</h5>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">
                  Nombre del Material <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Ej: Rosas Rojas, Papel Kraft, etc."
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="py-2"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">
                  Unidad <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) =>
                    setFormData({ ...formData, unit: value })
                  }
                  disabled={loadingUnits}
                >
                  <SelectTrigger className="py-2">
                    <SelectValue placeholder="Seleccionar unidad..." />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit._id} value={unit._id}>
                        {unit.name} ({unit.abbreviation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {units.length === 0 && !loadingUnits && (
                  <p className="text-sm text-red-500">
                    No hay unidades disponibles. Por favor, crea una primero.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">
                  Piezas por Paquete <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="1"
                  value={formData.piecesPerPackage}
                  onChange={(e) =>
                    setFormData({ ...formData, piecesPerPackage: parseInt(e.target.value) || 1 })
                  }
                  required
                  className="py-2"
                />
                <p className="text-sm text-muted-foreground">
                  Cantidad de piezas que vienen por paquete
                </p>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">Estado</Label>
                <div className="pt-2 flex items-center gap-3">
                  <Switch
                    id="status-switch"
                    checked={formData.status}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, status: checked })
                    }
                  />
                  <Label htmlFor="status-switch" className="text-lg">
                    {formData.status ? "Activo" : "Inactivo"}
                  </Label>
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label className="font-semibold">Descripcion</Label>
                <Textarea
                  rows={3}
                  placeholder="Descripcion opcional del material..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Precios */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardHeader className="bg-white border-0 py-3">
            <div className="flex items-center gap-2">
              <DollarSign size={20} className="text-primary" />
              <h5 className="mb-0 font-bold text-lg">Precios</h5>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">
                  Costo <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.cost}
                  onChange={(e) =>
                    setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })
                  }
                  required
                  className="py-2"
                />
                <p className="text-sm text-muted-foreground">
                  Costo de adquisicion del material
                </p>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">
                  Precio de Venta <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                  }
                  required
                  className="py-2"
                />
                <p className="text-sm text-muted-foreground">
                  Precio de venta al publico
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen Financiero */}
        {formData.price > 0 && formData.cost > 0 && (
          <Card className="mb-4 border-0 shadow-sm overflow-hidden">
            <CardHeader className="bg-green-600 text-white py-3">
              <div className="flex items-center gap-2">
                <DollarSign size={20} />
                <h5 className="mb-0 font-bold text-lg">Resumen Financiero</h5>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Precio de Venta:</span>
                    <span className="text-xl text-primary">
                      ${formatNumber(formData.price)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Costo:</span>
                    <span className="text-xl text-red-500">
                      ${formatNumber(formData.cost)}
                    </span>
                  </div>
                  <hr className="my-3" />
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-2xl">Ganancia:</span>
                    <span className="text-3xl font-bold text-green-600">
                      ${formatNumber(ganancia)}
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="p-4 bg-muted rounded-lg">
                    <h6 className="text-muted-foreground mb-2">Margen de Ganancia</h6>
                    <div className="text-5xl font-bold text-green-600 mb-2">
                      {margen.toFixed(1)}%
                    </div>
                    <small className="text-muted-foreground">
                      Por cada ${formatNumber(formData.price)} vendido, ganas ${formatNumber(ganancia)}
                    </small>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botones */}
        <div className="flex justify-between gap-2 mb-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleBack}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Volver
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={loading || loadingUnits}
            className="flex items-center gap-2 px-5"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {loading ? "Guardando..." : isEditing ? "Actualizar Material" : "Crear Material"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewMaterialPage;
