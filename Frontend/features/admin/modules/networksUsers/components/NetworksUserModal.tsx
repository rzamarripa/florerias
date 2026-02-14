import React, { useState, useEffect } from "react";
import { Save, Wrench, Eye, EyeOff, Building2, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { NetworksUser, CreateNetworksUserData, UpdateNetworksUserData } from "../types";
import { apiCall } from "@/utils/api";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { companiesService } from "@/features/admin/modules/companies/services/companies";
import { branchesService } from "@/features/admin/modules/branches/services/branches";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NetworksUserModalProps {
  show: boolean;
  onHide: () => void;
  user: NetworksUser | null;
  onSave: (data: CreateNetworksUserData | UpdateNetworksUserData) => void;
  loading?: boolean;
}

const NetworksUserModal: React.FC<NetworksUserModalProps> = ({
  show,
  onHide,
  user,
  onSave,
  loading = false,
}) => {
  const { getIsAdmin, getIsManager } = useUserRoleStore();
  const isAdminOrManager = getIsAdmin() || getIsManager();

  const [formData, setFormData] = useState<any>({
    username: "",
    email: "",
    phone: "",
    password: "",
    profile: {
      name: "",
      lastName: "",
    },
    branch: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userCompany, setUserCompany] = useState<any>(null);
  const [loadingUserCompany, setLoadingUserCompany] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [managerBranch, setManagerBranch] = useState<any>(null);
  const [redesRoleId, setRedesRoleId] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(false);

  // Load Redes role ID
  const loadRedesRole = async () => {
    setLoadingRole(true);
    try {
      const response = await apiCall<{ success: boolean; data: any[] }>(
        "/roles?estatus=true"
      );
      const redesRole = response.data?.find(
        (role) => role.name.toLowerCase() === "redes"
      );
      if (redesRole) {
        setRedesRoleId(redesRole._id);
      } else {
        toast.error("No se encontró el rol de Redes en el sistema");
      }
    } catch (err: any) {
      console.error("Error loading production role:", err);
      toast.error("Error al cargar el rol de Redes");
    } finally {
      setLoadingRole(false);
    }
  };

  // Load user company and branches for Admin/Manager
  const loadUserCompanyAndBranches = async () => {
    if (!isAdminOrManager) return;

    setLoadingUserCompany(true);
    try {
      // Si es gerente, obtener su sucursal directamente
      if (getIsManager()) {
        const branchResponse = await branchesService.getUserBranches();
        if (branchResponse.success && branchResponse.data && branchResponse.data.length > 0) {
          const branch = branchResponse.data[0];
          setManagerBranch(branch);
          setBranches([branch]); // Establecer solo la sucursal del gerente
          setFormData((prev: any) => ({ ...prev, branch: branch._id }));
          
          // Obtener la empresa a través de la sucursal
          if (branch.companyId && typeof branch.companyId === 'object') {
            setUserCompany(branch.companyId);
          } else if (branch.companyId && typeof branch.companyId === 'string') {
            // Si companyId es un string, buscar la empresa
            try {
              const companyResponse = await companiesService.getCompanyById(branch.companyId);
              if (companyResponse.success && companyResponse.data) {
                setUserCompany(companyResponse.data);
              }
            } catch (error) {
              console.error("Error loading company from branch:", error);
            }
          }
        } else {
          toast.error("No se encontró una sucursal asignada para el gerente");
        }
      } 
      // Si es admin, cargar empresa y sucursales
      else if (getIsAdmin()) {
        const response = await companiesService.getUserCompany();
        if (response.success && response.data) {
          setUserCompany(response.data);
          // Load branches for this company
          await loadBranches(response.data._id);
        }
      }
    } catch (err: any) {
      console.error("Error loading user data:", err);
      if (!err.message?.includes("no tiene una empresa asignada")) {
        toast.error(err.message || "Error al cargar los datos del usuario");
      }
    } finally {
      setLoadingUserCompany(false);
    }
  };

  // Load branches for the company
  const loadBranches = async (companyId: string) => {
    setLoadingBranches(true);
    try {
      const response = await branchesService.getAllBranches({
        companyId,
        isActive: true,
        limit: 100,
      });
      if (response.success && response.data) {
        setBranches(response.data);
      }
    } catch (err: any) {
      console.error("Error loading branches:", err);
      toast.error(err.message || "Error al cargar las sucursales");
    } finally {
      setLoadingBranches(false);
    }
  };

  useEffect(() => {
    if (show) {
      if (!user) {
        // En modo creación, cargar el rol de Redes
        loadRedesRole();
      }
      if (isAdminOrManager) {
        loadUserCompanyAndBranches();
      }
    }
  }, [show, isAdminOrManager]);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        phone: user.phone,
        password: "",
        profile: {
          name: user.profile.name,
          lastName: user.profile.lastName,
        },
        branch: user.branch?._id || "",
      });
    } else {
      setFormData({
        username: "",
        email: "",
        phone: "",
        password: "",
        profile: {
          name: "",
          lastName: "",
        },
        branch: getIsManager() && managerBranch ? managerBranch._id : "",
      });
    }
    setErrors({});
  }, [user, show, managerBranch]);

  const handleChange = (field: string, value: any) => {
    if (field.startsWith("profile.")) {
      const profileField = field.split(".")[1];
      setFormData((prev: any) => ({
        ...prev,
        profile: {
          ...prev.profile,
          [profileField]: value,
        },
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "El nombre de usuario es requerido";
    }
    if (!formData.email.trim()) {
      newErrors.email = "El correo electrónico es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El correo no es válido";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "El teléfono es requerido";
    }
    if (!formData.profile.name.trim()) {
      newErrors["profile.name"] = "El nombre es requerido";
    }
    if (!formData.profile.lastName.trim()) {
      newErrors["profile.lastName"] = "El apellido es requerido";
    }
    
    // En modo creación, la contraseña y sucursal son requeridas
    if (!user) {
      if (!formData.password.trim()) {
        newErrors.password = "La contraseña es requerida";
      }
      if (!formData.branch) {
        newErrors.branch = "La sucursal es requerida";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      if (user) {
        // For update, only send changed fields
        const updateData: UpdateNetworksUserData = {
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          profile: {
            name: formData.profile.name,
            lastName: formData.profile.lastName,
          },
        };
        if (formData.password.trim()) {
          updateData.password = formData.password;
        }
        onSave(updateData);
      } else {
        // For create, send all required fields
        const createData: CreateNetworksUserData = {
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          profile: {
            name: formData.profile.name,
            lastName: formData.profile.lastName,
          },
          branch: formData.branch,
        };
        onSave(createData);
      }
    }
  };

  const isEditing = !!user;

  return (
    <Dialog open={show} onOpenChange={(open) => !loading && !open && onHide()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <Wrench className="h-5 w-5 text-primary" />
            ) : (
              <UserPlus className="h-5 w-5 text-primary" />
            )}
            {isEditing ? "Editar Usuario de Redes" : "Nuevo Usuario de Redes"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualiza la información del usuario de redes"
              : "Completa la información para crear un nuevo usuario de redes"}
          </DialogDescription>
        </DialogHeader>

        {isAdminOrManager && userCompany && (
          <Alert>
            <Building2 className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold">
                {userCompany.tradeName || userCompany.legalName}
              </div>
              <div className="text-sm text-muted-foreground">RFC: {userCompany.rfc}</div>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profile.name">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="profile.name"
                  type="text"
                  placeholder="Ingresa el nombre"
                  value={formData.profile.name}
                  onChange={(e) => handleChange("profile.name", e.target.value)}
                />
                {errors["profile.name"] && (
                  <p className="text-sm text-destructive">{errors["profile.name"]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile.lastName">
                  Apellido <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="profile.lastName"
                  type="text"
                  placeholder="Ingresa el apellido"
                  value={formData.profile.lastName}
                  onChange={(e) => handleChange("profile.lastName", e.target.value)}
                />
                {errors["profile.lastName"] && (
                  <p className="text-sm text-destructive">{errors["profile.lastName"]}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">
                  Nombre de Usuario <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingresa el nombre de usuario"
                  value={formData.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Teléfono <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Ingresa el número de teléfono"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Correo Electrónico <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Ingresa el correo electrónico"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Contraseña
                {isEditing ? (
                  <span className="text-muted-foreground text-xs ml-1">
                    (Dejar vacío para mantener actual)
                  </span>
                ) : (
                  <span className="text-destructive"> *</span>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingresa la contraseña"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch">
                Sucursal
                {!isEditing && <span className="text-destructive"> *</span>}
              </Label>
              <Select
                value={formData.branch}
                onValueChange={(value) => handleChange("branch", value)}
                disabled={isEditing || loadingBranches || loadingUserCompany}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingBranches || loadingUserCompany
                        ? "Cargando sucursales..."
                        : isEditing
                        ? "Sucursal asignada"
                        : branches.length === 0
                        ? "No hay sucursales disponibles"
                        : "Selecciona una sucursal"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {branches.length > 0 ? (
                    branches.map((branch) => (
                      <SelectItem key={branch._id} value={branch._id}>
                        {branch.branchName} ({branch.branchCode})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-branches" disabled>
                      No hay sucursales disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {isEditing && (
                <p className="text-sm text-muted-foreground">
                  La sucursal no se puede cambiar al editar un usuario de redes
                </p>
              )}
              {getIsManager() && !isEditing && managerBranch && (
                <p className="text-sm text-muted-foreground">
                  Los usuarios serán asignados a tu sucursal: {managerBranch.branchName}
                </p>
              )}
              {errors.branch && (
                <p className="text-sm text-destructive">{errors.branch}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onHide} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || loadingUserCompany || loadingBranches || loadingRole}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? "Actualizar Usuario" : "Crear Usuario"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NetworksUserModal;