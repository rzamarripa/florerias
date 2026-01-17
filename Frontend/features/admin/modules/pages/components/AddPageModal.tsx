import { Plus, Trash2, FileText, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { CreateModuleData, modulesService } from "../services/modules";
import { CreatePageData, pagesService } from "../services/pages";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

const createPageSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  path: z.string().min(1, "La ruta es requerida"),
  description: z.string().optional(),
});

interface CreatePageFormData {
  name: string;
  path: string;
  description: string;
}

interface ModuleRow {
  id: string;
  nombre: string;
  description: string;
}

interface CreatePageModalProps {
  show: boolean;
  onHide: () => void;
  onPageCreated: () => void;
}

const CreatePageModal: React.FC<CreatePageModalProps> = ({
  show,
  onHide,
  onPageCreated,
}) => {
  const [formData, setFormData] = useState<CreatePageFormData>({
    name: "",
    path: "",
    description: "",
  });

  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [currentModule, setCurrentModule] = useState({
    nombre: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    field: keyof CreatePageFormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleAddModule = () => {
    if (currentModule.nombre.trim()) {
      const newModule: ModuleRow = {
        id: Date.now().toString(),
        nombre: currentModule.nombre.trim(),
        description: currentModule.description.trim(),
      };

      setModules((prev) => [...prev, newModule]);
      setCurrentModule({ nombre: "", description: "" });

      toast.success(`Módulo "${newModule.nombre}" agregado a la lista`);
    }
  };

  const handleRemoveModule = (id: string) => {
    const moduleToRemove = modules.find((m) => m.id === id);
    setModules((prev) => prev.filter((module) => module.id !== id));

    if (moduleToRemove) {
      toast.success(`Módulo "${moduleToRemove.nombre}" eliminado de la lista`);
    }
  };

  const validateForm = (): boolean => {
    try {
      createPageSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Por favor corrige los errores en el formulario");
      return;
    }

    try {
      setLoading(true);

      const pageData: CreatePageData = {
        name: formData.name,
        path: formData.path,
        description: formData.description || undefined,
      };

      const pageResponse = await pagesService.createPage(pageData);

      if (!pageResponse.success || !pageResponse.data) {
        throw new Error(pageResponse.message || "Error al crear la página");
      }

      const createdPageId = pageResponse.data._id;
      const createdPageName = pageResponse.data.name;

      toast.success(`Página "${createdPageName}" creada correctamente`);

      if (modules.length > 0) {
        const moduleIds: string[] = [];
        let modulesCreated = 0;
        let modulesFailed = 0;

        for (const mod of modules) {
          try {
            const moduleData: CreateModuleData = {
              name: mod.nombre,
              description: mod.description,
              page: createdPageId,
            };

            const moduleResponse = await modulesService.createModule(
              moduleData
            );

            if (moduleResponse.success && moduleResponse.data) {
              moduleIds.push(moduleResponse.data._id);
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
          toast.success(`${modulesCreated} módulo(s) creado(s) correctamente`);
        }

        if (modulesFailed > 0) {
          toast.warning(`${modulesFailed} módulo(s) no pudieron ser creados`);
        }
      }

      setFormData({ name: "", path: "", description: "" });
      setModules([]);
      setCurrentModule({ nombre: "", description: "" });
      setErrors({});

      onPageCreated();
      onHide();
    } catch (error) {
      console.error("Error creating page:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error al crear la página";
      setErrors({
        general: errorMessage,
      });
      toast.error(`Error al crear la página: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: "", path: "", description: "" });
    setModules([]);
    setCurrentModule({ nombre: "", description: "" });
    setErrors({});
    onHide();
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !loading && !open && handleClose()}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Crear nueva página
          </DialogTitle>
          <DialogDescription>
            Completa los datos para crear una nueva página en el sistema
          </DialogDescription>
        </DialogHeader>

        {errors.general && (
          <Alert variant="destructive">
            <AlertDescription>{errors.general}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre de la página <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Nombre de la página"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="path">
                  Ruta de la página <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="path"
                  type="text"
                  placeholder="Ruta de la página"
                  value={formData.path}
                  onChange={(e) => handleInputChange("path", e.target.value)}
                />
                {errors.path && (
                  <p className="text-sm text-destructive">{errors.path}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="Descripción de la página"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
              />
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold border-b pb-2">
                Módulos de la página
              </h4>

              <div className="grid grid-cols-[1fr_1fr_auto] gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="moduleName">Nombre del módulo</Label>
                  <Input
                    id="moduleName"
                    type="text"
                    placeholder="Nombre del módulo"
                    value={currentModule.nombre}
                    onChange={(e) =>
                      setCurrentModule((prev) => ({
                        ...prev,
                        nombre: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="moduleDescription">Descripción del módulo</Label>
                  <Input
                    id="moduleDescription"
                    type="text"
                    placeholder="Descripción del módulo"
                    value={currentModule.description}
                    onChange={(e) =>
                      setCurrentModule((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleAddModule}
                  disabled={!currentModule.nombre.trim() || loading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>

              {modules.length > 0 && (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 text-center">#</TableHead>
                        <TableHead className="text-center">Nombre del módulo</TableHead>
                        <TableHead className="text-center">Descripción del módulo</TableHead>
                        <TableHead className="w-20 text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modules.map((module, index) => (
                        <TableRow key={module.id}>
                          <TableCell className="text-center text-muted-foreground font-mono text-sm">
                            {index + 1}
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {module.nombre || "Sin nombre"}
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {module.description || "Sin descripción"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Eliminar módulo"
                              onClick={() => handleRemoveModule(module.id)}
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
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
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePageModal;
