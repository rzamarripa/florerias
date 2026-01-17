import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, FileText, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  UpdatePageFormData,
  updatePageSchema,
} from "../schemas/editPageSchema";
import { ModuleFormData, moduleSchema } from "../schemas/moduleSchema";
import { CreateModuleData, Module, modulesService } from "../services/modules";
import { pagesService, UpdatePageData } from "../services/pages";
import { ModuleRow } from "../types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EditPageModalProps {
  show: boolean;
  onHide: () => void;
  onPageUpdated: () => void;
  pageId: string | null;
}

const EditPageModal: React.FC<EditPageModalProps> = ({
  show,
  onHide,
  onPageUpdated,
  pageId,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<UpdatePageFormData>({
    resolver: zodResolver(updatePageSchema),
    defaultValues: {
      name: "",
      path: "",
      description: "",
    },
  });

  const {
    register: registerModule,
    handleSubmit: handleSubmitModule,
    formState: { errors: moduleErrors },
    reset: resetModule,
    watch: watchModule,
  } = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      nombre: "",
      description: "",
    },
  });

  const [existingModules, setExistingModules] = useState<ModuleRow[]>([]);
  const [newModules, setNewModules] = useState<ModuleRow[]>([]);
  const [loadingPage, setLoadingPage] = useState(false);
  const [deletingModules, setDeletingModules] = useState<Set<string>>(
    new Set()
  );

  const allModules = [...existingModules, ...newModules];
  const moduleNombre = watchModule("nombre");

  useEffect(() => {
    if (show && pageId) {
      loadPageData();
    } else if (!show) {
      reset();
      resetModule();
      setExistingModules([]);
      setNewModules([]);
      setDeletingModules(new Set());
    }
  }, [show, pageId, reset, resetModule]);

  const loadPageData = async () => {
    if (!pageId) {
      console.error("ERROR: No pageId provided to loadPageData");
      toast.error("Error: ID de página faltante");
      return;
    }

    try {
      setLoadingPage(true);
      const pageResponse = await pagesService.getPageById(pageId);

      if (pageResponse.success && pageResponse.data) {
        const page = pageResponse.data;
        console.log("✅ Datos de página cargados correctamente:", page);

        setValue("name", page.name);
        setValue("path", page.path);
        setValue("description", page.description || "");
      } else {
        throw new Error("No se pudieron cargar los datos de la página");
      }

      const modulesResponse = await modulesService.getModulesByPage(pageId, {
        limit: 100,
      });

      if (modulesResponse.success && modulesResponse.data) {
        const modules = modulesResponse.data
          .filter((module: Module) => {
            const isValid =
              module &&
              module._id &&
              typeof module._id === "string" &&
              module._id.trim() !== "";
            if (!isValid) {
              console.warn("❌ Módulo descartado por ID inválido:", module);
            }
            return isValid;
          })
          .map((module: Module) => {
            return {
              id: module._id,
              nombre: module.name || "Sin nombre",
              description: module.description || "",
              isExisting: true,
            };
          });

        setExistingModules(modules);
      } else {
        console.log("No se encontraron módulos o error en la respuesta");
        setExistingModules([]);
      }
    } catch (error) {
      console.error("❌ ERROR cargando datos de página:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      toast.error(`Error al cargar los datos de la página: ${errorMessage}`);
    } finally {
      setLoadingPage(false);
    }
  };

  const handleAddModule = handleSubmitModule((data: ModuleFormData) => {
    const newModule: ModuleRow = {
      id: `new_${Date.now()}`,
      nombre: data.nombre.trim(),
      description: data.description?.trim() || "",
      isExisting: false,
    };

    setNewModules((prev) => [...prev, newModule]);
    resetModule();
    toast.success(`Módulo "${newModule.nombre}" agregado a la lista`);
  });

  const handleRemoveNewModule = (id: string) => {
    const moduleToRemove = newModules.find((m) => m.id === id);
    setNewModules((prev) => prev.filter((module) => module.id !== id));

    if (moduleToRemove) {
      toast.success(`Módulo "${moduleToRemove.nombre}" eliminado de la lista`);
    }
  };

  const handleRemoveExistingModule = async (moduleId: string) => {
    if (!pageId) {
      const errorMsg = "Error: ID de página faltante";
      toast.error(errorMsg);
      return;
    }

    if (!moduleId) {
      const errorMsg = "Error: ID de módulo faltante";
      toast.error(errorMsg);
      return;
    }

    if (typeof pageId !== "string" || pageId.trim() === "") {
      const errorMsg = "Error: ID de página inválido";
      toast.error(errorMsg);
      return;
    }

    if (typeof moduleId !== "string" || moduleId.trim() === "") {
      const errorMsg = "Error: ID de módulo inválido";
      toast.error(errorMsg);
      return;
    }

    const moduleToDelete = existingModules.find((m) => m.id === moduleId);
    const moduleName = moduleToDelete?.nombre || "el módulo";

    try {
      console.log("id del modulo: ", moduleId);
      setDeletingModules((prev) => new Set(prev).add(moduleId));

      const response = await pagesService.removeModuleFromPage(
        pageId,
        moduleId
      );
      console.log(response);

      if (response.success) {
        setExistingModules((prev) =>
          prev.filter((module) => module.id !== moduleId)
        );
        toast.success(`Módulo "${moduleName}" eliminado correctamente`);
      } else {
        throw new Error(
          response.message || "Error al eliminar el módulo de la base de datos"
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error desconocido al eliminar el módulo";

      toast.error(
        `Error al eliminar el módulo "${moduleName}": ${errorMessage}`
      );
    } finally {
      setDeletingModules((prev) => {
        const newSet = new Set(prev);
        newSet.delete(moduleId);
        return newSet;
      });
    }
  };

  const onSubmit = async (data: UpdatePageFormData) => {
    if (!pageId) {
      toast.error("Error: ID de página faltante");
      return;
    }

    try {
      const pageData: UpdatePageData = {
        name: data.name,
        path: data.path,
        description: data.description || undefined,
      };

      const pageResponse = await pagesService.updatePage(pageId, pageData);

      if (!pageResponse.success) {
        throw new Error(
          pageResponse.message || "Error al actualizar la página"
        );
      }

      toast.success(`Página "${data.name}" actualizada correctamente`);

      if (newModules.length > 0) {
        let modulesCreated = 0;
        let modulesFailed = 0;

        for (const mod of newModules) {
          try {
            const moduleData: CreateModuleData = {
              name: mod.nombre,
              description: mod.description,
              page: pageId,
            };

            const moduleResponse = await modulesService.createModule(
              moduleData
            );

            if (moduleResponse.success) {
              modulesCreated++;
            } else {
              modulesFailed++;
              console.error(
                `Error creando módulo ${mod.nombre}:`,
                moduleResponse.message
              );
            }
          } catch (moduleError) {
            modulesFailed++;
            console.error(`Error creando módulo ${mod.nombre}:`, moduleError);
          }
        }

        if (modulesCreated > 0) {
          toast.success(
            `${modulesCreated} módulo(s) nuevo(s) creado(s) correctamente`
          );
        }

        if (modulesFailed > 0) {
          toast.warning(`${modulesFailed} módulo(s) no pudieron ser creados`);
        }
      }

      handleClose();
      onPageUpdated();
    } catch (error) {
      console.error("Error updating page:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al actualizar la página";
      toast.error(`Error al actualizar la página: ${errorMessage}`);
    }
  };

  const handleClose = () => {
    reset();
    resetModule();
    setExistingModules([]);
    setNewModules([]);
    setDeletingModules(new Set());
    onHide();
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !isSubmitting && !open && handleClose()}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Actualizar página
          </DialogTitle>
          <DialogDescription>
            Actualiza los datos de la página y sus módulos
          </DialogDescription>
        </DialogHeader>

        {loadingPage ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-muted-foreground">Cargando datos de la página...</p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">
                      Nombre de la página <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="edit-name"
                      type="text"
                      placeholder="Nombre de la página"
                      {...register("name")}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name?.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-path">
                      Ruta de la página <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="edit-path"
                      type="text"
                      placeholder="Ruta de la página"
                      {...register("path")}
                    />
                    {errors.path && (
                      <p className="text-sm text-destructive">{errors.path?.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Descripción (opcional)</Label>
                  <Textarea
                    id="edit-description"
                    rows={3}
                    placeholder="Descripción de la página"
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description?.message}</p>
                  )}
                </div>
              </div>
            </form>

            <div className="space-y-4">
              <h4 className="font-semibold border-b pb-2">
                Módulos de la página
              </h4>

              <form onSubmit={handleAddModule}>
                <div className="grid grid-cols-[1fr_1fr_auto] gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="edit-moduleName">Nombre del módulo</Label>
                    <Input
                      id="edit-moduleName"
                      type="text"
                      placeholder="Nombre del módulo"
                      {...registerModule("nombre")}
                    />
                    {moduleErrors.nombre && (
                      <p className="text-sm text-destructive">{moduleErrors.nombre?.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-moduleDescription">Descripción del módulo</Label>
                    <Input
                      id="edit-moduleDescription"
                      type="text"
                      placeholder="Descripción del módulo"
                      {...registerModule("description")}
                    />
                    {moduleErrors.description && (
                      <p className="text-sm text-destructive">{moduleErrors.description?.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={!moduleNombre?.trim() || isSubmitting}
                    title="Agregar módulo a la lista"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </form>

              {allModules.length > 0 && (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Nombre del módulo</TableHead>
                        <TableHead>Descripción del módulo</TableHead>
                        <TableHead className="w-20 text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allModules
                        .map((module, index) => {
                          if (!module || !module.id) {
                            console.warn("Módulo inválido encontrado:", module);
                            return null;
                          }

                          return (
                            <TableRow key={module.id}>
                              <TableCell className="text-muted-foreground font-mono text-sm">
                                {index + 1}
                              </TableCell>
                              <TableCell className="text-sm">
                                {module.nombre || "Sin nombre"}
                                {module.isExisting && (
                                  <Badge variant="secondary" className="ml-2">
                                    Existente
                                  </Badge>
                                )}
                                {!module.isExisting && (
                                  <Badge variant="default" className="ml-2 bg-green-600">
                                    Nuevo
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-sm">
                                {module.description || "Sin descripción"}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  title={
                                    module.isExisting
                                      ? "Eliminar módulo de la base de datos"
                                      : "Eliminar módulo de la lista"
                                  }
                                  onClick={() => {
                                    if (module.isExisting) {
                                      handleRemoveExistingModule(module.id);
                                    } else {
                                      handleRemoveNewModule(module.id);
                                    }
                                  }}
                                  disabled={
                                    deletingModules.has(module.id) ||
                                    isSubmitting
                                  }
                                >
                                  {deletingModules.has(module.id) ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                        .filter(Boolean)}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting || loadingPage}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditPageModal;
