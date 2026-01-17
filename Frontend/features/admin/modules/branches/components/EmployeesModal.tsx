"use client";

import React, { useState, useEffect } from "react";
import { X, Save, UserPlus, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Branch } from "../types";
import { branchesService } from "../services/branches";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { apiCall } from "@/utils/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Role {
  _id: string;
  name: string;
  description?: string;
}

interface NewEmployeeData {
  username: string;
  email: string;
  phone: string;
  password: string;
  profile: {
    name: string;
    lastName: string;
  };
  role: string;
}

interface EmployeesModalProps {
  show: boolean;
  onHide: () => void;
  branch: Branch;
  onEmployeesUpdated?: () => void;
}

const EmployeesModal: React.FC<EmployeesModalProps> = ({
  show,
  onHide,
  branch,
  onEmployeesUpdated,
}) => {
  const { user } = useUserSessionStore();

  // Estado para el formulario de un solo empleado
  const [formData, setFormData] = useState<NewEmployeeData>({
    username: "",
    email: "",
    phone: "",
    password: "",
    profile: {
      name: "",
      lastName: "",
    },
    role: "",
  });

  const [employeesList, setEmployeesList] = useState<NewEmployeeData[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar si el usuario tiene permisos (Gerente o Administrador)
  const hasPermission =
    user?.role?.name === "Gerente" || user?.role?.name === "Administrador";

  useEffect(() => {
    if (show) {
      loadRoles();
      resetForm();
      setEmployeesList([]);
      setError(null);
    }
  }, [show]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await apiCall<{ success: boolean; data: Role[] }>(
        "/roles?estatus=true"
      );

      // Filtrar solo roles de empleados (excluir Super Admin, Administrador, Distribuidor)
      const employeeRoles = (response.data || []).filter(
        (role) =>
          role.name !== "Super Admin" &&
          role.name !== "Administrador" &&
          role.name !== "Distribuidor"
      );

      setRoles(employeeRoles);
    } catch (err: any) {
      console.error("Error al cargar roles:", err);
      setError("Error al cargar los roles");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      phone: "",
      password: "",
      profile: {
        name: "",
        lastName: "",
      },
      role: "",
    });
  };

  const handleInputChange = (field: string, value: string) => {
    const keys = field.split(".");

    if (keys.length === 1) {
      setFormData({ ...formData, [keys[0]]: value });
    } else if (keys.length === 2) {
      setFormData({
        ...formData,
        [keys[0]]: {
          ...(formData as any)[keys[0]],
          [keys[1]]: value,
        },
      });
    }
  };

  const validateEmployee = (): boolean => {
    if (!formData.username.trim()) {
      setError("El nombre de usuario es requerido");
      return false;
    }

    if (!formData.email.trim()) {
      setError("El email es requerido");
      return false;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("El email no es válido");
      return false;
    }

    if (!formData.phone.trim()) {
      setError("El teléfono es requerido");
      return false;
    }

    if (!formData.password.trim()) {
      setError("La contraseña es requerida");
      return false;
    }

    if (!formData.profile.name.trim()) {
      setError("El nombre es requerido");
      return false;
    }

    if (!formData.profile.lastName.trim()) {
      setError("El apellido es requerido");
      return false;
    }

    if (!formData.role.trim()) {
      setError("El rol es requerido");
      return false;
    }

    // Verificar que el username no esté duplicado en la lista
    const duplicateUsername = employeesList.find(
      (emp) => emp.username.toLowerCase() === formData.username.toLowerCase()
    );
    if (duplicateUsername) {
      setError("Ya existe un empleado con este nombre de usuario en la lista");
      return false;
    }

    // Verificar que el email no esté duplicado en la lista
    const duplicateEmail = employeesList.find(
      (emp) => emp.email.toLowerCase() === formData.email.toLowerCase()
    );
    if (duplicateEmail) {
      setError("Ya existe un empleado con este email en la lista");
      return false;
    }

    return true;
  };

  const handleAddEmployee = () => {
    setError(null);

    if (!validateEmployee()) {
      return;
    }

    // Agregar a la lista
    setEmployeesList([...employeesList, { ...formData }]);

    // Resetear formulario
    resetForm();

    toast.success("Empleado agregado a la lista");
  };

  const handleRemoveEmployee = (index: number) => {
    const updated = [...employeesList];
    updated.splice(index, 1);
    setEmployeesList(updated);
    toast.info("Empleado removido de la lista");
  };

  const getRoleName = (roleId: string): string => {
    const role = roles.find((r) => r._id === roleId);
    return role ? role.name : "N/A";
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (employeesList.length === 0) {
        setError("Debes agregar al menos un empleado a la lista");
        setSaving(false);
        return;
      }

      // Enviar empleados al backend para crearlos y asignarlos a la sucursal
      const response = await branchesService.addEmployeesToBranch(branch._id, {
        employeesData: employeesList,
      });

      if (!response.success) {
        const errorMsg = response.message || "Error al agregar empleados";
        setError(errorMsg);
        toast.error(errorMsg);
        setSaving(false);
        return;
      }

      toast.success(
        `${employeesList.length} empleado(s) agregado(s) exitosamente`
      );
      onEmployeesUpdated?.();
      onHide();
    } catch (err: any) {
      const errorMessage = err.message || "Error al agregar empleados";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onHide();
    }
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !saving && !open && handleClose()}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Agregar Empleados - {branch.branchName}
          </DialogTitle>
          <DialogDescription>
            Completa el formulario para agregar empleados a esta sucursal
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 p-1">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!hasPermission && (
              <Alert variant="destructive">
                <X className="h-4 w-4" />
                <AlertDescription>
                  <strong>Permisos insuficientes</strong>
                  <p className="mt-1 mb-0">
                    Solo los usuarios con rol <strong>Gerente</strong> o{" "}
                    <strong>Administrador</strong> pueden agregar empleados.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground mt-3">Cargando roles...</p>
              </div>
            ) : (
              <>
                {/* Formulario para agregar un empleado */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h6 className="font-semibold mb-4">Agregar Nuevo Empleado</h6>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">
                        Nombre de Usuario <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Nombre de usuario"
                        value={formData.username}
                        onChange={(e) => handleInputChange("username", e.target.value)}
                        disabled={!hasPermission}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        disabled={!hasPermission}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        Teléfono <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Teléfono"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        disabled={!hasPermission}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">
                        Nombre <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Nombre"
                        value={formData.profile.name}
                        onChange={(e) => handleInputChange("profile.name", e.target.value)}
                        disabled={!hasPermission}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">
                        Apellido <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Apellido"
                        value={formData.profile.lastName}
                        onChange={(e) => handleInputChange("profile.lastName", e.target.value)}
                        disabled={!hasPermission}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">
                        Contraseña <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Contraseña"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        disabled={!hasPermission}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-3">
                      <Label htmlFor="role">
                        Rol <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) => handleInputChange("role", value)}
                        disabled={!hasPermission}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="-- Seleccione un rol --" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role._id} value={role._id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button
                      onClick={handleAddEmployee}
                      disabled={!hasPermission}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Agregar a la Lista
                    </Button>
                  </div>
                </div>

                {/* Tabla de empleados agregados */}
                <div>
                  <h6 className="font-semibold mb-3">
                    Empleados a Agregar ({employeesList.length})
                  </h6>
                  {employeesList.length === 0 ? (
                    <Alert>
                      <AlertDescription>
                        No hay empleados en la lista. Completa el formulario superior
                        y haz clic en "Agregar a la Lista".
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Nombre Completo</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead>Rol</TableHead>
                          <TableHead className="w-20 text-center">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employeesList.map((employee, index) => (
                          <TableRow key={index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{employee.username}</TableCell>
                            <TableCell>
                              {employee.profile.name} {employee.profile.lastName}
                            </TableCell>
                            <TableCell>{employee.email}</TableCell>
                            <TableCell>{employee.phone}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {getRoleName(employee.role)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleRemoveEmployee(index)}
                                title="Quitar de la lista"
                                disabled={!hasPermission}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !hasPermission || employeesList.length === 0}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar ({employeesList.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeesModal;
