"use client";

import { Plus, Loader2 } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { rolesService } from "../services/roles";
import { Module, Page, SelectedModules } from "../types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CreateRoleModalProps {
  pages: Page[];
  reloadData: () => void;
}

const CreateRoleModal: React.FC<CreateRoleModalProps> = ({
  pages,
  reloadData,
}) => {
  const [show, setShow] = useState<boolean>(false);
  const [roleName, setRoleName] = useState<string>("");
  const [selectedModules, setSelectedModules] = useState<SelectedModules>({});
  const [loading, setLoading] = useState<boolean>(false);

  const handleShow = useCallback(() => setShow(true), []);
  const handleClose = useCallback(() => {
    setShow(false);
    setRoleName("");
    setSelectedModules({});
  }, []);

  useEffect(() => {
    if (show && pages.length > 0) {
      const initialModules: SelectedModules = {};
      pages.forEach((page) => {
        page.modules.forEach((module) => {
          initialModules[module._id] = false;
        });
      });
      setSelectedModules(initialModules);
    }
  }, [show, pages]);

  const handleRoleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setRoleName(e.target.value);
    },
    []
  );

  const handleModuleChange = useCallback(
    (moduleId: string, checked: boolean) => {
      setSelectedModules((prev) => ({
        ...prev,
        [moduleId]: checked,
      }));
    },
    []
  );

  const getStatusIndicator = useCallback(
    (page: Page) => {
      if (page.modules.length === 0) {
        return <span className="ml-2 text-destructive">○</span>;
      }

      const hasSelectedModules = page.modules.some(
        (module) => selectedModules[module._id]
      );

      if (hasSelectedModules) {
        return <span className="ml-2 text-green-600">●</span>;
      }
      return <span className="ml-2 text-yellow-600">○</span>;
    },
    [selectedModules]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roleName.trim()) {
      toast.error("El nombre del rol es requerido");
      return;
    }

    try {
      setLoading(true);

      const selectedModuleIds = Object.entries(selectedModules)
        .filter(([_, isSelected]) => isSelected)
        .map(([moduleId, _]) => moduleId);

      const response = await rolesService.createRole({
        name: roleName.trim(),
        modules: selectedModuleIds,
      });

      if (response.success && response.data) {
        handleClose();
        reloadData();
        toast.success("Rol creado exitosamente");
      } else {
        toast.error(response.message || "Error al crear el rol");
      }
    } catch (error) {
      console.error("Error creating role:", error);
      toast.error("Error al crear el rol");
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = Object.values(selectedModules).filter(Boolean).length;

  return (
    <>
      <Button onClick={handleShow}>
        <Plus className="h-4 w-4 mr-2" />
        Nuevo Rol
      </Button>

      <Dialog open={show} onOpenChange={(open) => !loading && setShow(open)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Rol</DialogTitle>
            <DialogDescription>
              Define un nombre y selecciona los módulos para el nuevo rol
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="roleName">
                  Nombre del rol <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="roleName"
                  type="text"
                  placeholder="Escriba el nombre del rol"
                  value={roleName}
                  onChange={handleRoleNameChange}
                  disabled={loading}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">
                  Módulos ({selectedCount} seleccionados)
                </Label>

                <ScrollArea className="h-[350px] border rounded-md">
                  {pages.map((page: Page) => (
                    <div key={page._id} className="border-b last:border-b-0">
                      <div className="bg-muted px-3 py-2 text-sm">
                        <div className="flex items-center">
                          <span className="font-semibold">{page.name}</span>
                          {getStatusIndicator(page)}
                        </div>
                      </div>

                      {page.modules.map((module: Module) => (
                        <div
                          key={module._id}
                          className="flex items-center space-x-2 px-3 py-2 border-b last:border-b-0"
                        >
                          <Checkbox
                            id={`modal-${module._id}`}
                            checked={selectedModules[module._id] || false}
                            onCheckedChange={(checked) =>
                              handleModuleChange(module._id, checked as boolean)
                            }
                            disabled={loading}
                          />
                          <label
                            htmlFor={`modal-${module._id}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {module.name}
                          </label>
                        </div>
                      ))}

                      {page.modules.length === 0 && (
                        <div className="px-3 py-3 text-center">
                          <span className="text-muted-foreground text-sm italic">
                            Sin módulos disponibles
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !roleName.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Rol"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateRoleModal;
