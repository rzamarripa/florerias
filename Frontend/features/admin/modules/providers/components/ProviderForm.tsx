"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { providerSchema, ProviderFormData } from "../schemas/providerSchema";
import { providersService } from "../services/providers";
import { companiesService } from "../../companies/services/companies";
import { Provider } from "../types";
import { useUserRoleStore } from "@/stores/userRoleStore";

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

interface ProviderFormProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
  provider?: Provider | null;
}

const ProviderForm: React.FC<ProviderFormProps> = ({
  show,
  onHide,
  onSuccess,
  provider,
}) => {
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [userCompany, setUserCompany] = useState<{ _id: string; legalName: string; tradeName?: string; rfc: string } | null>(null);
  const [loadingUserCompany, setLoadingUserCompany] = useState(false);

  const { getIsAdmin, getIsManager, getIsSuperAdmin } = useUserRoleStore();
  const isAdminOrManager = getIsAdmin() || getIsManager();
  const isSuperAdmin = getIsSuperAdmin();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProviderFormData>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      contactName: "",
      tradeName: "",
      legalName: "",
      rfc: "",
      phone: "",
      address: {
        street: "",
        city: "",
        state: "",
        postalCode: "",
      },
      email: "",
      company: "",
    },
  });

  useEffect(() => {
    if (show) {
      // Si es Super Admin, cargar todas las empresas
      if (isSuperAdmin) {
        loadCompanies();
      }
      // Si es Administrador o Gerente, cargar su empresa específica
      else if (isAdminOrManager) {
        loadUserCompany();
      }

      if (provider) {
        reset({
          contactName: provider.contactName,
          tradeName: provider.tradeName,
          legalName: provider.legalName,
          rfc: provider.rfc,
          phone: provider.phone,
          address: provider.address,
          email: provider.email,
          company: provider.company._id,
        });
      } else {
        reset({
          contactName: "",
          tradeName: "",
          legalName: "",
          rfc: "",
          phone: "",
          address: {
            street: "",
            city: "",
            state: "",
            postalCode: "",
          },
          email: "",
          company: "",
        });
      }
    }
  }, [show, provider, reset, isSuperAdmin, isAdminOrManager]);

  // Efecto para establecer automáticamente la empresa cuando se carga
  useEffect(() => {
    if (userCompany && !provider && isAdminOrManager) {
      setValue("company", userCompany._id);
    }
  }, [userCompany, provider, setValue, isAdminOrManager]);

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const response = await companiesService.getAllCompanies({
        page: 1,
        limit: 1000,
        isActive: true,
      });
      if (response.data) {
        setCompanies(response.data);
      }
    } catch (error: any) {
      toast.error("Error al cargar las empresas");
      console.error("Error loading companies:", error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const loadUserCompany = async () => {
    try {
      setLoadingUserCompany(true);
      const response = await companiesService.getUserCompany();
      if (response.success && response.data) {
        setUserCompany(response.data);
      }
    } catch (error: any) {
      toast.error("Error al cargar la empresa del usuario");
      console.error("Error loading user company:", error);
    } finally {
      setLoadingUserCompany(false);
    }
  };

  const onSubmit = async (data: ProviderFormData) => {
    try {
      setLoading(true);

      if (provider) {
        await providersService.updateProvider(provider._id, data);
        toast.success("Proveedor actualizado exitosamente");
      } else {
        await providersService.createProvider(data);
        toast.success("Proveedor creado exitosamente");
      }

      onSuccess();
      onHide();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el proveedor");
      console.error("Error saving provider:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !loading && !open && onHide()}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            {provider ? "Editar Proveedor" : "Nuevo Proveedor"}
          </DialogTitle>
          <DialogDescription>
            {provider
              ? "Actualiza la información del proveedor"
              : "Completa los datos del nuevo proveedor"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {/* Empresa */}
            <div className="space-y-2">
              <Label htmlFor="company">
                Empresa <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="company"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={
                      loadingCompanies ||
                      loadingUserCompany ||
                      !!provider ||
                      isAdminOrManager
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {isSuperAdmin ? (
                        companies.map((company) => (
                          <SelectItem key={company._id} value={company._id}>
                            {company.legalName} - {company.rfc}
                          </SelectItem>
                        ))
                      ) : isAdminOrManager && userCompany ? (
                        <SelectItem value={userCompany._id}>
                          {userCompany.legalName} - {userCompany.rfc}
                        </SelectItem>
                      ) : (
                        <SelectItem value="">Cargando empresa...</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.company && (
                <p className="text-sm text-destructive">{errors.company.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Nombre de Contacto */}
              <div className="space-y-2">
                <Label htmlFor="contactName">
                  Nombre de Contacto <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="contactName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="text"
                      placeholder="Juan Pérez"
                    />
                  )}
                />
                {errors.contactName && (
                  <p className="text-sm text-destructive">{errors.contactName.message}</p>
                )}
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Teléfono <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="text"
                      placeholder="5512345678"
                    />
                  )}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Nombre Comercial */}
              <div className="space-y-2">
                <Label htmlFor="tradeName">
                  Nombre Comercial <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="tradeName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="text"
                      placeholder="Mi Empresa S.A."
                    />
                  )}
                />
                {errors.tradeName && (
                  <p className="text-sm text-destructive">{errors.tradeName.message}</p>
                )}
              </div>

              {/* Nombre Fiscal */}
              <div className="space-y-2">
                <Label htmlFor="legalName">
                  Nombre Fiscal <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="legalName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="text"
                      placeholder="Mi Empresa S.A. de C.V."
                    />
                  )}
                />
                {errors.legalName && (
                  <p className="text-sm text-destructive">{errors.legalName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* RFC */}
              <div className="space-y-2">
                <Label htmlFor="rfc">
                  RFC <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="rfc"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="text"
                      placeholder="ABC123456XYZ"
                      maxLength={13}
                      className="uppercase"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  )}
                />
                {errors.rfc && (
                  <p className="text-sm text-destructive">{errors.rfc.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="email"
                      placeholder="contacto@ejemplo.com"
                    />
                  )}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Dirección Section */}
            <div className="border-t pt-4 mt-2">
              <h4 className="font-semibold mb-4">Dirección</h4>

              {/* Calle */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="address.street">
                  Calle <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="address.street"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="text"
                      placeholder="Av. Principal #123"
                    />
                  )}
                />
                {errors.address?.street && (
                  <p className="text-sm text-destructive">{errors.address.street.message}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Ciudad */}
                <div className="space-y-2">
                  <Label htmlFor="address.city">
                    Ciudad <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="address.city"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="text"
                        placeholder="Ciudad de México"
                      />
                    )}
                  />
                  {errors.address?.city && (
                    <p className="text-sm text-destructive">{errors.address.city.message}</p>
                  )}
                </div>

                {/* Estado */}
                <div className="space-y-2">
                  <Label htmlFor="address.state">
                    Estado <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="address.state"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="text"
                        placeholder="CDMX"
                      />
                    )}
                  />
                  {errors.address?.state && (
                    <p className="text-sm text-destructive">{errors.address.state.message}</p>
                  )}
                </div>

                {/* Código Postal */}
                <div className="space-y-2">
                  <Label htmlFor="address.postalCode">
                    Código Postal <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="address.postalCode"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="text"
                        placeholder="01234"
                        maxLength={5}
                      />
                    )}
                  />
                  {errors.address?.postalCode && (
                    <p className="text-sm text-destructive">{errors.address.postalCode.message}</p>
                  )}
                </div>
              </div>
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
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : provider ? (
                "Actualizar Proveedor"
              ) : (
                "Crear Proveedor"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProviderForm;
