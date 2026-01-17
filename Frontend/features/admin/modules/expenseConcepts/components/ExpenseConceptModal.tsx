"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { expenseConceptSchema, ExpenseConceptFormData } from "../schemas/expenseConceptSchema";
import { expenseConceptsService } from "../services/expenseConcepts";
import { ExpenseConcept } from "../types";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useActiveBranchStore } from "@/stores/activeBranchStore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface ExpenseConceptModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
  concept?: ExpenseConcept | null;
}

const DEPARTMENT_OPTIONS = [
  { value: "sales", label: "Ventas" },
  { value: "administration", label: "Administración" },
  { value: "operations", label: "Operaciones" },
  { value: "marketing", label: "Marketing" },
  { value: "finance", label: "Finanzas" },
  { value: "human_resources", label: "Recursos Humanos" },
  { value: "other", label: "Otro" },
];

const ExpenseConceptModal: React.FC<ExpenseConceptModalProps> = ({
  show,
  onHide,
  onSuccess,
  concept,
}) => {
  const [loading, setLoading] = useState(false);
  const { user } = useUserSessionStore();
  const { activeBranch } = useActiveBranchStore();
  const isGerente = user?.role?.name === "Gerente";

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseConceptFormData>({
    resolver: zodResolver(expenseConceptSchema),
    defaultValues: {
      name: "",
      description: "",
      department: "sales",
    },
  });

  useEffect(() => {
    if (show) {
      if (concept) {
        reset({
          name: concept.name,
          description: concept.description || "",
          department: concept.department,
        });
      } else {
        reset({
          name: "",
          description: "",
          department: "sales",
        });
      }
    }
  }, [show, concept, reset]);

  const onSubmit = async (data: ExpenseConceptFormData) => {
    try {
      setLoading(true);

      let finalData = { ...data };

      if (!concept) {
        if (isGerente) {
          delete finalData.branch;
        } else if (activeBranch) {
          finalData.branch = activeBranch._id;
        } else {
          toast.error("Por favor selecciona una sucursal");
          setLoading(false);
          return;
        }
      }

      if (concept) {
        const { branch, ...updateData } = finalData;
        await expenseConceptsService.updateExpenseConcept(concept._id, updateData);
        toast.success("Concepto actualizado exitosamente");
      } else {
        await expenseConceptsService.createExpenseConcept(finalData);
        toast.success("Concepto creado exitosamente");
      }

      onSuccess();
      onHide();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el concepto");
      console.error("Error saving concept:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {concept ? "Editar Concepto de Gasto" : "Nuevo Concepto de Gasto"}
          </DialogTitle>
          <DialogDescription>
            {concept
              ? "Actualiza la información del concepto"
              : "Completa los datos del nuevo concepto"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre del Concepto <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="name"
                    type="text"
                    placeholder="Ej: Renta de local, Electricidad, Papelería"
                    className={errors.name ? "border-destructive" : ""}
                  />
                )}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Departamento */}
            <div className="space-y-2">
              <Label htmlFor="department">
                Departamento <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="department"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className={errors.department ? "border-destructive" : ""}>
                      <SelectValue placeholder="Selecciona el departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.department && (
                <p className="text-sm text-destructive">{errors.department.message}</p>
              )}
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción (Opcional)</Label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="description"
                    placeholder="Describe el concepto de gasto..."
                    rows={3}
                    className={errors.description ? "border-destructive" : ""}
                  />
                )}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
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
              ) : concept ? (
                "Actualizar Concepto"
              ) : (
                "Crear Concepto"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseConceptModal;
