"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Save,
  ArrowLeft,
  User,
  MapPin,
  UserPlus,
  X,
  Upload,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import { companiesService } from "./services/companies";
import { CreateCompanyData, Distributor } from "./types";
import { legalForms } from "./schemas/companySchema";
import { uploadCompanyLogo } from "@/services/firebaseStorage";
import { usersService } from "@/features/admin/modules/users/services/users";

const NewCompanyPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const companyId = params?.id as string;
  const isEditing = !!companyId;

  const [formData, setFormData] = useState<CreateCompanyData>({
    legalName: "",
    tradeName: "",
    rfc: "",
    legalForm: "S.A. de C.V.",
    fiscalAddress: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
    },
    primaryContact: {
      name: "",
      email: "",
      phone: "",
    },
    administratorId: "",
    administratorData: {
      username: "",
      email: "",
      phone: "",
      password: "",
      profile: {
        name: "",
        lastName: "",
      },
    },
    isFranchise: false,
  });

  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    loadDistributors();
  }, [companyId]);

  useEffect(() => {
    if (isEditing) {
      loadCompany();
    }
  }, [companyId]);

  const loadDistributors = async () => {
    try {
      const response = await companiesService.getAdministrators(isEditing ? companyId : undefined);
      setDistributors(response.data || []);
    } catch (err: any) {
      console.error("Error al cargar administradores:", err);
    }
  };

  const loadCompany = async () => {
    try {
      setLoading(true);
      const response = await companiesService.getCompanyById(companyId);
      const company = response.data;

      const administratorId = company.administrator?._id || "";

      setFormData({
        legalName: company.legalName,
        tradeName: company.tradeName || "",
        rfc: company.rfc,
        legalForm: company.legalForm,
        fiscalAddress: company.fiscalAddress,
        primaryContact: company.primaryContact,
        administratorId: administratorId,
        administratorData: company.administrator
          ? {
              username: company.administrator.username,
              email: company.administrator.email,
              phone: company.administrator.phone,
              password: "",
              profile: {
                name: company.administrator.profile.name,
                lastName: company.administrator.profile.lastName,
              },
            }
          : {
              username: "",
              email: "",
              phone: "",
              password: "",
              profile: {
                name: "",
                lastName: "",
              },
            },
        isFranchise: company.isFranchise || false,
      });
    } catch (err: any) {
      toast.error(err.message || "Error al cargar la empresa");
      router.push("/gestion/empresas");
    } finally {
      setLoading(false);
    }
  };

  const handleDistributorChange = (selectedId: string) => {
    if (selectedId === "") {
      setFormData({
        ...formData,
        administratorId: "",
        administratorData: {
          username: "",
          email: "",
          phone: "",
          password: "",
          profile: {
            name: "",
            lastName: "",
          },
        },
        primaryContact: {
          name: "",
          email: "",
          phone: "",
        },
      });
    } else {
      const distributor = distributors.find((d) => d._id === selectedId);
      if (distributor) {
        setFormData({
          ...formData,
          administratorId: selectedId,
          administratorData: {
            username: distributor.username,
            email: distributor.email,
            phone: distributor.phone,
            password: "",
            profile: {
              name: distributor.profile.name,
              lastName: distributor.profile.lastName,
            },
          },
          primaryContact: {
            name: distributor.profile.fullName,
            email: distributor.email,
            phone: distributor.phone,
          },
        });
      }
    }
  };

  const handleClearDistributor = () => {
    setFormData({
      ...formData,
      administratorId: "",
      administratorData: {
        username: "",
        email: "",
        phone: "",
        password: "",
        profile: {
          name: "",
          lastName: "",
        },
      },
      primaryContact: {
        name: "",
        email: "",
        phone: "",
      },
    });
  };

  const validateForm = (): boolean => {
    if (!formData.legalName || !formData.rfc || !formData.legalForm) {
      setError("Por favor completa todos los campos requeridos de la empresa");
      return false;
    }

    if (
      !formData.fiscalAddress.street ||
      !formData.fiscalAddress.city ||
      !formData.fiscalAddress.state ||
      !formData.fiscalAddress.postalCode
    ) {
      setError("Por favor completa todos los campos de la dirección fiscal");
      return false;
    }

    if (
      !formData.primaryContact.name ||
      !formData.primaryContact.email ||
      !formData.primaryContact.phone
    ) {
      setError("Por favor completa todos los campos del contacto principal");
      return false;
    }

    if (
      !formData.administratorData?.username ||
      !formData.administratorData?.email ||
      !formData.administratorData?.phone ||
      !formData.administratorData?.profile?.name ||
      !formData.administratorData?.profile?.lastName
    ) {
      setError("Por favor completa todos los campos del usuario administrador");
      return false;
    }

    if (!formData.administratorId) {
      if (!formData.administratorData?.password) {
        setError("La contraseña es requerida para crear un nuevo usuario");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let finalAdministratorId = formData.administratorId;

      if (isEditing && formData.administratorId && formData.administratorData) {
        const userDataToUpdate = {
          username: formData.administratorData.username,
          email: formData.administratorData.email,
          phone: formData.administratorData.phone,
          profile: {
            name: formData.administratorData.profile.name,
            lastName: formData.administratorData.profile.lastName,
            fullName: `${formData.administratorData.profile.name} ${formData.administratorData.profile.lastName}`,
          },
        };

        if (formData.administratorData.password && formData.administratorData.password.trim() !== "") {
          (userDataToUpdate as any).password = formData.administratorData.password;
        }

        await usersService.updateUser(formData.administratorId, userDataToUpdate);
      }

      if (isEditing && !formData.administratorId && formData.administratorData) {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
        const rolesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/roles?name=Administrador`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const rolesData = await rolesResponse.json();
        const adminRole = rolesData.data?.find((r: any) => r.name === "Administrador");

        if (!adminRole) {
          throw new Error("No se encontró el rol de Administrador");
        }

        const newUserData = {
          username: formData.administratorData.username,
          email: formData.administratorData.email,
          phone: formData.administratorData.phone,
          password: formData.administratorData.password,
          profile: {
            name: formData.administratorData.profile.name,
            lastName: formData.administratorData.profile.lastName,
            fullName: `${formData.administratorData.profile.name} ${formData.administratorData.profile.lastName}`,
          },
          role: adminRole._id,
        };

        const createUserResponse = await usersService.createUser(newUserData);
        finalAdministratorId = createUserResponse.data.user._id;
      }

      const dataToSend: CreateCompanyData = {
        legalName: formData.legalName,
        tradeName: formData.tradeName || undefined,
        rfc: formData.rfc.toUpperCase(),
        legalForm: formData.legalForm,
        fiscalAddress: formData.fiscalAddress,
        primaryContact: formData.primaryContact,
        isFranchise: formData.isFranchise || false,
      };

      if (finalAdministratorId) {
        dataToSend.administratorId = finalAdministratorId;
      }

      if (!isEditing && !finalAdministratorId && formData.administratorData) {
        dataToSend.administratorData = formData.administratorData;
      }

      let response;

      if (isEditing) {
        response = await companiesService.updateCompany(companyId, dataToSend);
      } else {
        response = await companiesService.createCompany(dataToSend);
      }

      if (!response.success) {
        if ((response as any).permissionDenied) {
          return;
        }
        throw new Error(response.message || "Error al guardar la empresa");
      }

      let logoUrl: string | null = null;
      let logoPath: string | null = null;

      if (logoFile) {
        setUploadingLogo(true);
        toast.info("Subiendo logo a Firebase Storage...");

        try {
          const savedCompanyId = response.data._id;

          const logoResult = await uploadCompanyLogo(logoFile, savedCompanyId);
          logoUrl = logoResult.url;
          logoPath = logoResult.path;

          await companiesService.updateCompany(savedCompanyId, {
            logoUrl,
            logoPath,
          });

          toast.success("Logo subido exitosamente");
        } catch (uploadError: any) {
          console.error("Error al subir logo:", uploadError);
          toast.warning("Empresa guardada pero hubo un error al subir el logo. Puedes intentar subirlo después.");
        } finally {
          setUploadingLogo(false);
        }
      }

      toast.success(
        isEditing
          ? "Empresa actualizada exitosamente"
          : "Empresa creada exitosamente"
      );
      router.push("/gestion/empresas");
    } catch (err: any) {
      setError(err.message || "Error al guardar la empresa");
      toast.error(err.message || "Error al guardar la empresa");
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <div
        className="flex justify-center items-center"
        style={{ minHeight: "400px" }}
      >
        <Loader2 className="animate-spin text-primary" size={32} />
        <span className="sr-only">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="new-company-page">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              <X size={16} />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Company Information */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardHeader className="bg-white border-0 py-3">
            <div className="flex items-center gap-2">
              <Building2 size={20} className="text-primary" />
              <h5 className="mb-0 font-bold">Datos de la Empresa</h5>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Legal Name */}
              <div>
                <Label className="font-semibold">
                  Razón Social <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Razón social de la empresa"
                  value={formData.legalName}
                  onChange={(e) =>
                    setFormData({ ...formData, legalName: e.target.value })
                  }
                  required
                  className="py-2"
                />
              </div>

              {/* Trade Name */}
              <div>
                <Label className="font-semibold">Nombre Comercial</Label>
                <Input
                  type="text"
                  placeholder="Nombre comercial (opcional)"
                  value={formData.tradeName}
                  onChange={(e) =>
                    setFormData({ ...formData, tradeName: e.target.value })
                  }
                  className="py-2"
                />
              </div>

              {/* RFC */}
              <div>
                <Label className="font-semibold">
                  RFC <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="RFC de la empresa"
                  value={formData.rfc}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rfc: e.target.value.toUpperCase(),
                    })
                  }
                  required
                  maxLength={13}
                  className="py-2 uppercase"
                />
                <p className="text-muted-foreground text-sm">
                  Formato: ABC123456XYZ (12-13 caracteres)
                </p>
              </div>

              {/* Legal Form */}
              <div>
                <Label className="font-semibold">
                  Forma Legal <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.legalForm}
                  onValueChange={(value) =>
                    setFormData({ ...formData, legalForm: value })
                  }
                >
                  <SelectTrigger className="py-2">
                    <SelectValue placeholder="Selecciona forma legal" />
                  </SelectTrigger>
                  <SelectContent>
                    {legalForms.map((form) => (
                      <SelectItem key={form} value={form}>
                        {form}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Company Logo */}
              <div className="md:col-span-1">
                <Label className="font-semibold flex items-center">
                  <Upload size={16} className="mr-2" />
                  Logo de la Empresa
                </Label>
                <Input
                  type="file"
                  className="py-2"
                  accept="image/*"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setLogoFile(file);
                    }
                  }}
                />
                {logoFile && (
                  <p className="text-green-500 text-sm">
                    Archivo seleccionado: {logoFile.name}
                  </p>
                )}
                <p className="text-muted-foreground text-sm">
                  Formatos aceptados: JPG, PNG, SVG. Tamaño recomendado: 500x500px
                </p>
              </div>

              {/* Franchise Checkbox */}
              <div className="flex items-center space-x-2 mt-4">
                <Checkbox
                  id="isFranchise"
                  checked={formData.isFranchise || false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isFranchise: checked as boolean })
                  }
                />
                <Label htmlFor="isFranchise" className="font-semibold">
                  Es Franquicia
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fiscal Address */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardHeader className="bg-white border-0 py-3">
            <div className="flex items-center gap-2">
              <MapPin size={20} className="text-primary" />
              <h5 className="mb-0 font-bold">Dirección Fiscal</h5>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Street */}
              <div className="md:col-span-3">
                <Label className="font-semibold">
                  Calle <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Calle y número"
                  value={formData.fiscalAddress.street}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fiscalAddress: {
                        ...formData.fiscalAddress,
                        street: e.target.value,
                      },
                    })
                  }
                  required
                  className="py-2"
                />
              </div>

              {/* City */}
              <div>
                <Label className="font-semibold">
                  Ciudad <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Ciudad"
                  value={formData.fiscalAddress.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fiscalAddress: {
                        ...formData.fiscalAddress,
                        city: e.target.value,
                      },
                    })
                  }
                  required
                  className="py-2"
                />
              </div>

              {/* State */}
              <div>
                <Label className="font-semibold">
                  Estado <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Estado"
                  value={formData.fiscalAddress.state}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fiscalAddress: {
                        ...formData.fiscalAddress,
                        state: e.target.value,
                      },
                    })
                  }
                  required
                  className="py-2"
                />
              </div>

              {/* Postal Code */}
              <div>
                <Label className="font-semibold">
                  Código Postal <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="00000"
                  value={formData.fiscalAddress.postalCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fiscalAddress: {
                        ...formData.fiscalAddress,
                        postalCode: e.target.value,
                      },
                    })
                  }
                  required
                  maxLength={5}
                  className="py-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Administrator User */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardHeader className="bg-white border-0 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus size={20} className="text-primary" />
                <h5 className="mb-0 font-bold">Usuario Administrador</h5>
              </div>
              {formData.administratorId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearDistributor}
                  className="flex items-center gap-1"
                  type="button"
                >
                  <X size={16} />
                  Limpiar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Administrator Selector */}
              <div className="md:col-span-2">
                <Label className="font-semibold">
                  Seleccionar Administrador (Opcional)
                </Label>
                <Select
                  value={formData.administratorId || "new"}
                  onValueChange={(value) => handleDistributorChange(value === "new" ? "" : value)}
                >
                  <SelectTrigger className="py-2">
                    <SelectValue placeholder="-- Seleccione un administrador existente o cree uno nuevo --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">
                      -- Crear nuevo administrador --
                    </SelectItem>
                    {distributors.map((dist) => (
                      <SelectItem key={dist._id} value={dist._id}>
                        {dist.profile.fullName} ({dist.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-sm">
                  {formData.administratorId
                    ? "Administrador seleccionado. Puede editar sus datos abajo."
                    : "Puede seleccionar un administrador existente o crear uno nuevo llenando los campos."}
                </p>
              </div>

              {/* Name */}
              <div>
                <Label className="font-semibold">Nombre</Label>
                <Input
                  type="text"
                  placeholder="Ingresa el nombre"
                  value={formData.administratorData?.profile.name || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      administratorData: formData.administratorData
                        ? {
                            ...formData.administratorData,
                            profile: {
                              ...formData.administratorData.profile,
                              name: e.target.value,
                            },
                          }
                        : undefined,
                      primaryContact: {
                        ...formData.primaryContact,
                        name: `${e.target.value} ${
                          formData.administratorData?.profile.lastName || ""
                        }`.trim(),
                      },
                    })
                  }
                  className="py-2"
                />
              </div>

              {/* Last Name */}
              <div>
                <Label className="font-semibold">Apellido</Label>
                <Input
                  type="text"
                  placeholder="Ingresa el apellido"
                  value={formData.administratorData?.profile.lastName || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      administratorData: formData.administratorData
                        ? {
                            ...formData.administratorData,
                            profile: {
                              ...formData.administratorData.profile,
                              lastName: e.target.value,
                            },
                          }
                        : undefined,
                      primaryContact: {
                        ...formData.primaryContact,
                        name: `${
                          formData.administratorData?.profile.name || ""
                        } ${e.target.value}`.trim(),
                      },
                    })
                  }
                  className="py-2"
                />
              </div>

              {/* Phone */}
              <div>
                <Label className="font-semibold">Teléfono</Label>
                <Input
                  type="tel"
                  placeholder="Ingresa el teléfono"
                  value={formData.administratorData?.phone || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      administratorData: formData.administratorData
                        ? {
                            ...formData.administratorData,
                            phone: e.target.value,
                          }
                        : undefined,
                      primaryContact: {
                        ...formData.primaryContact,
                        phone: e.target.value,
                      },
                    })
                  }
                  className="py-2"
                />
              </div>

              {/* Email */}
              <div>
                <Label className="font-semibold">Email</Label>
                <Input
                  type="email"
                  placeholder="Ingresa el email"
                  value={formData.administratorData?.email || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      administratorData: formData.administratorData
                        ? {
                            ...formData.administratorData,
                            email: e.target.value,
                          }
                        : undefined,
                      primaryContact: {
                        ...formData.primaryContact,
                        email: e.target.value,
                      },
                    })
                  }
                  className="py-2"
                />
              </div>

              {/* Username */}
              <div>
                <Label className="font-semibold">Nombre de Usuario</Label>
                <Input
                  type="text"
                  placeholder="Ingresa el nombre de usuario"
                  value={formData.administratorData?.username || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      administratorData: formData.administratorData
                        ? {
                            ...formData.administratorData,
                            username: e.target.value,
                          }
                        : undefined,
                    })
                  }
                  className="py-2"
                />
              </div>

              {/* Role - Always Administrator */}
              <div>
                <Label className="font-semibold">Rol</Label>
                <Input
                  type="text"
                  value="Administrador"
                  disabled
                  className="py-2"
                />
                <p className="text-muted-foreground text-sm">
                  Los usuarios de empresas siempre tienen rol Administrador
                </p>
              </div>

              {/* Password */}
              <div>
                <Label className="font-semibold">Contraseña</Label>
                <Input
                  type="password"
                  placeholder={
                    formData.administratorId
                      ? "******** (Sin cambios)"
                      : "Ingresa la contraseña"
                  }
                  value={formData.administratorData?.password || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      administratorData: formData.administratorData
                        ? {
                            ...formData.administratorData,
                            password: e.target.value,
                          }
                        : undefined,
                    })
                  }
                  className="py-2"
                />
                <p className="text-muted-foreground text-sm">
                  {formData.administratorId
                    ? "Dejar en blanco para mantener la contraseña actual"
                    : "Requerida para crear nuevo usuario"}
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <Label className="font-semibold">Confirmar Contraseña</Label>
                <Input
                  type="password"
                  placeholder={
                    formData.administratorId
                      ? "******** (Sin cambios)"
                      : "Confirma la contraseña"
                  }
                  className="py-2"
                />
                <p className="text-muted-foreground text-sm">
                  {formData.administratorId &&
                    "Solo si desea cambiar la contraseña"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Primary Contact */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardHeader className="bg-white border-0 py-3">
            <div className="flex items-center gap-2">
              <User size={20} className="text-primary" />
              <h5 className="mb-0 font-bold">Contacto Principal</h5>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Contact Name */}
              <div>
                <Label className="font-semibold">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Nombre del contacto"
                  value={formData.primaryContact.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      primaryContact: {
                        ...formData.primaryContact,
                        name: e.target.value,
                      },
                    })
                  }
                  required
                  className="py-2"
                />
                <p className="text-muted-foreground text-sm">
                  Se rellena automáticamente con los datos del usuario
                  administrador
                </p>
              </div>

              {/* Contact Email */}
              <div>
                <Label className="font-semibold">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={formData.primaryContact.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      primaryContact: {
                        ...formData.primaryContact,
                        email: e.target.value,
                      },
                    })
                  }
                  required
                  className="py-2"
                />
              </div>

              {/* Contact Phone */}
              <div>
                <Label className="font-semibold">
                  Teléfono <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="tel"
                  placeholder="1234567890"
                  value={formData.primaryContact.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      primaryContact: {
                        ...formData.primaryContact,
                        phone: e.target.value,
                      },
                    })
                  }
                  required
                  className="py-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buttons */}
        <div className="flex justify-between gap-2 mb-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Volver
          </Button>
          <Button
            type="submit"
            variant="default"
            size="lg"
            disabled={loading || uploadingLogo}
            className="flex items-center gap-2 px-5"
          >
            <Save size={18} />
            {uploadingLogo ? "Subiendo logo..." : loading ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewCompanyPage;
