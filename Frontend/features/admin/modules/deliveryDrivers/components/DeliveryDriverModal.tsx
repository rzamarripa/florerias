import React, { useState, useEffect } from "react";
import { Save, Truck, Eye, EyeOff, Building2, Loader2, UserPlus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { DeliveryDriver, CreateDeliveryDriverData, UpdateDeliveryDriverData } from "../types";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { companiesService } from "@/features/admin/modules/companies/services/companies";
import { branchesService } from "@/features/admin/modules/branches/services/branches";
import { apiCall } from "@/utils/api";
import { usersService } from "@/features/admin/modules/users/services/users";

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

interface DeliveryDriverModalProps {
  show: boolean;
  onHide: () => void;
  driver: DeliveryDriver | null;
  onSave: (data: CreateDeliveryDriverData | UpdateDeliveryDriverData) => void;
  loading?: boolean;
}

const DeliveryDriverModal: React.FC<DeliveryDriverModalProps> = ({
  show,
  onHide,
  driver,
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
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [userCompany, setUserCompany] = useState<any>(null);
  const [loadingUserCompany, setLoadingUserCompany] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [userBranch, setUserBranch] = useState<any>(null);
  const [loadingUserBranch, setLoadingUserBranch] = useState(false);
  const [deliveryDriverRoleId, setDeliveryDriverRoleId] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(false);

  const checkUsername = async (value: string) => {
    if (!value || value.trim().length < 2) { setUsernameAvailable(null); return; }
    setCheckingUsername(true);
    try {
      const result = await usersService.checkUsernameAvailability(value.trim());
      setUsernameAvailable(result.available);
    } catch { setUsernameAvailable(null); }
    finally { setCheckingUsername(false); }
  };

  // Load Repartidor role ID
  const loadDeliveryDriverRole = async () => {
    setLoadingRole(true);
    try {
      const response = await apiCall<{ success: boolean; data: any[] }>(
        "/roles?estatus=true"
      );
      const deliveryDriverRole = response.data?.find(
        (role) => role.name.toLowerCase() === "repartidor"
      );
      if (deliveryDriverRole) {
        setDeliveryDriverRoleId(deliveryDriverRole._id);
      } else {
        toast.error("No se encontró el rol de Repartidor en el sistema");
      }
    } catch (err: any) {
      console.error("Error loading delivery driver role:", err);
      toast.error("Error al cargar el rol de Repartidor");
    } finally {
      setLoadingRole(false);
    }
  };

  // Load user company for Admin/Manager
  const loadUserCompany = async () => {
    if (!isAdminOrManager) return;

    setLoadingUserCompany(true);
    try {
      const response = await companiesService.getUserCompany();
      if (response.success && response.data) {
        setUserCompany(response.data);
        // Load branches for this company
        await loadBranches(response.data._id);
      }
    } catch (err: any) {
      console.error("Error loading user company:", err);
      if (!err.message?.includes("no tiene una empresa asignada")) {
        toast.error(err.message || "Error al cargar la empresa del usuario");
      }
    } finally {
      setLoadingUserCompany(false);
    }
  };

  // Load user branch for Manager
  const loadUserBranch = async () => {
    if (!getIsManager()) return;

    setLoadingUserBranch(true);
    try {
      const response = await branchesService.getUserBranches();
      if (response.success && response.data && response.data.length > 0) {
        const branch = response.data[0];
        setUserBranch(branch);
        // Set the branch in branches array for validation
        setBranches([branch]);
        // Set the branch directly in form data
        setFormData(prev => ({ ...prev, branch: branch._id }));
        
        // Obtener la empresa a través de la sucursal
        if (branch.companyId && typeof branch.companyId === 'object') {
          setUserCompany(branch.companyId);
        }
      } else {
        toast.error("No se encontró una sucursal asignada para el gerente");
      }
    } catch (err: any) {
      console.error("Error loading user branch:", err);
      toast.error(err.message || "Error al cargar la sucursal del usuario");
    } finally {
      setLoadingUserBranch(false);
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
      if (!driver) {
        // En modo creación, cargar el rol de Repartidor
        loadDeliveryDriverRole();
        if (getIsManager()) {
          loadUserBranch();
        } else if (getIsAdmin()) {
          loadUserCompany();
        }
      } else if (driver && getIsAdmin()) {
        // En modo edición solo cargar la empresa si es admin
        loadUserCompany();
      }
    }
  }, [show, driver]);

  useEffect(() => {
    if (driver) {
      setFormData({
        username: driver.username,
        email: driver.email,
        phone: driver.phone,
        password: "",
        profile: {
          name: driver.profile.name,
          lastName: driver.profile.lastName,
        },
        branch: driver.branch?._id || "",
      });
    } else {
      // For creation mode
      setFormData({
        username: "",
        email: "",
        phone: "",
        password: "",
        profile: {
          name: "",
          lastName: "",
        },
        branch: getIsManager() && userBranch ? userBranch._id : "",
      });
    }
    setErrors({});
    setUsernameAvailable(null);
  }, [driver, show, userBranch]);

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
    
    // Password is required for creation
    if (!driver && !formData.password.trim()) {
      newErrors.password = "La contraseña es requerida";
    }
    
    // Branch is required for creation
    if (!driver && !formData.branch) {
      newErrors.branch = "La sucursal es requerida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      if (driver) {
        // For update, only send changed fields
        const updateData: UpdateDeliveryDriverData = {
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
        // For creation, send all required fields
        const createData: CreateDeliveryDriverData = {
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

  const isEditing = !!driver;

  return (
    <Dialog open={show} onOpenChange={(open) => !loading && !open && onHide()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <Truck className="h-5 w-5 text-primary" />
            ) : (
              <UserPlus className="h-5 w-5 text-primary" />
            )}
            {isEditing ? "Editar Repartidor" : "Nuevo Repartidor"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Actualiza la información del repartidor" : "Registra un nuevo repartidor en el sistema"}
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
                  onChange={(e) => { setUsernameAvailable(null); handleChange("username", e.target.value); }}
                  onBlur={() => { if (!driver) checkUsername(formData.username); }}
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username}</p>
                )}
                {checkingUsername && <p className="text-sm text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Verificando disponibilidad...</p>}
                {usernameAvailable === false && !checkingUsername && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Este nombre de usuario no está disponible</p>}
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

            {!isEditing && (
              <div className="space-y-2">
                <Label htmlFor="branch">
                  Sucursal <span className="text-destructive">*</span>
                </Label>
                {getIsManager() ? (
                  <div className="p-2 border rounded-md bg-muted">
                    <p className="text-sm font-medium">
                      {userBranch ? `${userBranch.branchName} (${userBranch.branchCode})` : "Cargando sucursal..."}
                    </p>
                  </div>
                ) : (
                  <Select
                    value={formData.branch}
                    onValueChange={(value) => handleChange("branch", value)}
                    disabled={loadingBranches}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingBranches ? "Cargando sucursales..." : "Selecciona una sucursal"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch._id} value={branch._id}>
                          {branch.branchName} ({branch.branchCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.branch && (
                  <p className="text-sm text-destructive">{errors.branch}</p>
                )}
              </div>
            )}
            {isEditing && driver?.branch && (
              <div className="space-y-2">
                <Label>Sucursal</Label>
                <div className="p-2 border rounded-md bg-muted">
                  <p className="text-sm font-medium">
                    {driver.branch.branchName} ({driver.branch.branchCode})
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    La sucursal no se puede cambiar al editar un repartidor
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onHide} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || loadingUserCompany || loadingBranches || loadingUserBranch || loadingRole || (!driver && !deliveryDriverRoleId) || usernameAvailable === false || checkingUsername}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  {isEditing ? (
                    <Save className="h-4 w-4 mr-2" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  {isEditing ? "Actualizar Repartidor" : "Crear Repartidor"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryDriverModal;