"use client";

import { FileText, Settings, Users, Pencil, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import CreateRoleModal from "./components/CreateRolModal";
import { rolesService } from "./services/roles";
import { Module, Page, Role, SelectedModules } from "./types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedModules, setSelectedModules] = useState<SelectedModules>({});
  const [originalRoleModules, setOriginalRoleModules] = useState<{
    [roleId: string]: string[];
  }>({});
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editedName, setEditedName] = useState<string>("");

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async (): Promise<void> => {
    try {
      setLoading(true);

      const [rolesResponse, pagesResponse] = await Promise.all([
        rolesService.getAll(),
        rolesService.getPages(),
      ]);

      if (rolesResponse.success && rolesResponse.data) {
        setRoles(rolesResponse.data);

        const roleModulesMap: { [roleId: string]: string[] } = {};
        rolesResponse.data.forEach((role: Role) => {
          roleModulesMap[role._id] = role.modules.map((module: any) =>
            typeof module === "string" ? module : module._id
          );
        });
        setOriginalRoleModules(roleModulesMap);
      }

      if (pagesResponse.success && pagesResponse.data) {
        setPages(pagesResponse.data);

        if (selectedRole && pagesResponse.data.length > 0) {
          const roleModules = originalRoleModules[selectedRole._id] || [];
          const newSelectedModules: SelectedModules = {};

          pagesResponse.data.forEach((page) => {
            page.modules.forEach((module) => {
              newSelectedModules[module._id] = roleModules.includes(module._id);
            });
          });

          setSelectedModules(newSelectedModules);
        }
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
      toast.error("Error al cargar los datos iniciales");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: Role): void => {
    setSelectedRole(role);
    setIsEditing(false);

    const roleModules = originalRoleModules[role._id] || [];
    const newSelectedModules: SelectedModules = {};

    pages.forEach((page) => {
      page.modules.forEach((module) => {
        const isSelected = roleModules.includes(module._id);
        newSelectedModules[module._id] = isSelected;
      });
    });

    setSelectedModules(newSelectedModules);
  };

  const handleEdit = (): void => {
    setIsEditing(true);
  };

  const handleCancel = (): void => {
    setIsEditing(false);
    if (selectedRole) {
      handleRoleSelect(selectedRole);
    }
  };

  const handleModuleChange = (moduleId: string, checked: boolean): void => {
    setSelectedModules((prev: SelectedModules) => ({
      ...prev,
      [moduleId]: checked,
    }));
  };

  const handleSubmit = async (): Promise<void> => {
    if (!selectedRole) return;

    try {
      setLoading(true);

      const selectedModuleIds = Object.entries(selectedModules)
        .filter(([_, isSelected]) => isSelected)
        .map(([moduleId, _]) => moduleId);

      const response = await rolesService.update(selectedRole._id, {
        modules: selectedModuleIds.map((id) => ({ _id: id } as Module)),
      });

      if (response.success) {
        setOriginalRoleModules((prev) => ({
          ...prev,
          [selectedRole._id]: selectedModuleIds,
        }));

        setRoles((prev) =>
          prev.map((role) =>
            role._id === selectedRole._id
              ? {
                  ...role,
                  modules: selectedModuleIds.map(
                    (id) => ({ _id: id } as Module)
                  ),
                }
              : role
          )
        );

        setIsEditing(false);
        toast.success("Módulos actualizados correctamente");
      } else {
        toast.error(response.message || "Error al actualizar los módulos");
      }
    } catch (error) {
      console.error("Error updating role modules:", error);
      toast.error("Error al actualizar los módulos del rol");
    } finally {
      setLoading(false);
    }
  };

  const handleNameSave = async () => {
    if (
      !selectedRole ||
      editedName.trim() === "" ||
      editedName === selectedRole.name
    ) {
      setIsEditingName(false);
      return;
    }
    try {
      setLoading(true);
      const response = await rolesService.update(selectedRole._id, {
        name: editedName,
      });
      if (response.success) {
        setRoles((prev) =>
          prev.map((role) =>
            role._id === selectedRole._id ? { ...role, name: editedName } : role
          )
        );
        setSelectedRole((prev) =>
          prev ? { ...prev, name: editedName } : prev
        );
        toast.success("Nombre actualizado correctamente");
      } else {
        toast.error(response.message || "Error al actualizar el nombre");
      }
    } catch (error) {
      toast.error("Error al actualizar el nombre");
    } finally {
      setIsEditingName(false);
      setLoading(false);
    }
  };

  const getStatusIndicator = (page: Page) => {
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
  };

  const getModuleCountForRole = (roleId: string): number => {
    return originalRoleModules[roleId]?.length || 0;
  };

  return (
    <div className="space-y-4">
      {/* Header with action */}
      <div className="flex justify-end">
        <CreateRoleModal pages={pages} reloadData={loadInitialData} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Roles List */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {roles.map((role: Role) => (
                  <button
                    key={role._id + role.name}
                    onClick={() => handleRoleSelect(role)}
                    className={cn(
                      "w-full px-4 py-3 text-left transition-colors hover:bg-muted/50",
                      selectedRole?._id === role._id && "bg-muted border-l-2 border-l-primary"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{role.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {getModuleCountForRole(role._id)}
                        </Badge>
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Module Configuration */}
        <div className="md:col-span-2">
          {selectedRole ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <div className="flex items-center gap-2">
                    {isEditingName ? (
                      <Input
                        type="text"
                        value={editedName}
                        autoFocus
                        onChange={(e) => setEditedName(e.target.value)}
                        onBlur={handleNameSave}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleNameSave();
                          if (e.key === "Escape") setIsEditingName(false);
                        }}
                        className="h-8 w-auto"
                      />
                    ) : (
                      <>
                        <CardTitle
                          onClick={() => {
                            setEditedName(selectedRole.name);
                            setIsEditingName(true);
                          }}
                          className="cursor-pointer hover:text-muted-foreground"
                        >
                          {selectedRole.name}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            setEditedName(selectedRole.name);
                            setIsEditingName(true);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Módulos ({Object.values(selectedModules).filter(Boolean).length}{" "}
                    seleccionados)
                  </p>
                </div>
                <div>
                  {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={handleEdit}>
                      Editar
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        disabled={loading}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          "Guardar"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loading && !isEditing ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground mt-3">Cargando módulos...</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px] pr-4">
                    {pages.map((page: Page) => (
                      <div
                        key={page._id}
                        className="mb-2 border rounded-md overflow-hidden"
                      >
                        <div className="bg-muted px-3 py-2 text-sm">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4" />
                            <span className="font-semibold ml-2">{page.name}</span>
                            {getStatusIndicator(page)}
                          </div>
                        </div>

                        {page.modules.map((module: Module) => (
                          <div
                            key={module._id}
                            className="flex items-center justify-between px-3 py-2 border-b last:border-b-0"
                          >
                            <label
                              htmlFor={module._id}
                              className={cn(
                                "text-sm flex-1",
                                isEditing ? "cursor-pointer" : "cursor-default"
                              )}
                            >
                              {module.name}
                            </label>
                            <Checkbox
                              id={module._id}
                              checked={selectedModules[module._id] || false}
                              onCheckedChange={(checked) =>
                                handleModuleChange(module._id, checked as boolean)
                              }
                              disabled={!isEditing}
                            />
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
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold">Selecciona un rol</h3>
                <p className="text-muted-foreground text-center">
                  Selecciona un rol de la lista para ver y editar sus módulos
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default RolesPage;
