"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import RoleVisibilityTree from "../../userVisibility/components/UserVisibilityTree";
import { roleSchema } from "../schemas/roleSchema";
import { roleService } from "../services/roleService";

interface RoleFormProps {
  roleId?: string;
  onSave?: () => void;
}

const RoleForm: React.FC<RoleFormProps> = ({ roleId, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState<any[]>([]);
  const [showVisibility, setShowVisibility] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(roleSchema),
  });

  useEffect(() => {
    if (roleId) {
      loadRole();
    }
    loadModules();
  }, [roleId]);

  const loadRole = async () => {
    try {
      const response = await roleService.getById(roleId);
      if (response.success) {
        reset(response.data);
        setSelectedModules(response.data.modules || []);
        setShowVisibility(true);
      }
    } catch (error) {
      console.error("Error al cargar el rol:", error);
    }
  };

  const loadModules = async () => {
    try {
      const response = await roleService.getModules();
      if (response.success) {
        setModules(response.data);
      }
    } catch (error) {
      console.error("Error al cargar los modulos:", error);
    }
  };

  const handleModuleChange = (moduleId: string, checked: boolean) => {
    const newSelectedModules = checked
      ? [...selectedModules, moduleId]
      : selectedModules.filter((id) => id !== moduleId);

    setSelectedModules(newSelectedModules);
    setValue("modules", newSelectedModules);
  };

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      const submitData = { ...data, modules: selectedModules };
      const response = roleId
        ? await roleService.update(roleId, submitData)
        : await roleService.create(submitData);

      if (response.success) {
        toast.success(response.message || "Rol guardado exitosamente");
        if (!roleId) {
          reset();
          setSelectedModules([]);
        }
        if (onSave) {
          onSave();
        }
        setShowVisibility(true);
      } else {
        toast.error(response.message || "Error al guardar el rol");
      }
    } catch (error) {
      console.error("Error al guardar el rol:", error);
      toast.error("Error al guardar el rol");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <h4 className="text-lg font-semibold">{roleId ? "Editar" : "Nuevo"} Rol</h4>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  type="text"
                  {...register("name")}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">
                    {errors.name.message as string}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripcion</Label>
                <Input
                  id="description"
                  type="text"
                  {...register("description")}
                  className={errors.description ? "border-red-500" : ""}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">
                    {errors.description.message as string}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label>Modulos</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {modules.map((module) => (
                  <div key={module._id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`module-${module._id}`}
                      checked={selectedModules.includes(module._id)}
                      onCheckedChange={(checked) =>
                        handleModuleChange(module._id, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`module-${module._id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {module.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {showVisibility && roleId && (
        <div className="mt-4">
          <RoleVisibilityTree roleId={roleId} />
        </div>
      )}
    </div>
  );
};

export default RoleForm;
