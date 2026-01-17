"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Plus, Upload, X, Pencil, Loader2 } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { Role } from "../../roles/types";
import { UserFormData, userFormSchema } from "../schemas/userSchema";
import { usersService } from "../services/users";
import type { User } from "../types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UsersModalProps {
  user?: User;
  roles: Role[];
  onSuccess?: () => void;
}

const UsersModal: React.FC<UsersModalProps> = ({ user, roles, onSuccess }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removedExistingImage, setRemovedExistingImage] =
    useState<boolean>(false);

  const isEditing = Boolean(user);
  const { getIsSuperAdmin } = useUserRoleStore();

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      profile: {
        name: "",
        lastName: "",
        fullName: "",
        estatus: true,
      },
      role: "",
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
  } = form;

  const getUserImageUrl = (user: User): string | null => {
    if (user?.profile?.image?.data) {
      return `data:${user.profile.image.contentType};base64,${user.profile.image.data}`;
    }
    return null;
  };

  useEffect(() => {
    if (isOpen) {
      if (isEditing && user) {
        setRemovedExistingImage(false);

        let roleValue = "";
        if (user.role) {
          if (typeof user.role === "object") {
            roleValue = user.role._id;
          } else {
            roleValue = user.role;
          }
        }

        setValue("username", user.username || "");
        setValue("email", user.email || "");
        setValue("phone", user.phone || "");
        setValue("password", "");
        setValue("confirmPassword", "");
        setValue("profile.name", user.profile?.name || "");
        setValue("profile.lastName", user.profile?.lastName || "");
        setValue("profile.fullName", user.profile?.fullName || "");
        setValue("profile.estatus", user.profile?.estatus ?? true);
        setValue("role", roleValue);

        const userImageUrl = getUserImageUrl(user);
        if (userImageUrl) {
          setImagePreview(userImageUrl);
        } else {
          setImagePreview(null);
        }
      } else {
        setRemovedExistingImage(false);
        reset({
          username: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
          profile: {
            name: "",
            lastName: "",
            fullName: "",
            estatus: true,
          },
          role: "",
        });
        setImagePreview(null);
      }
    }
  }, [isOpen, isEditing, user, reset, setValue]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "profile.name" || name === "profile.lastName") {
        const name = form.getValues("profile.name") || "";
        const lastName = form.getValues("profile.lastName") || "";
        const fullName = getFullName(name, lastName);
        form.setValue("profile.fullName", fullName);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        toast.error("Por favor selecciona un archivo JPG o PNG válido");
        const fileInput = document.getElementById(
          "imageInput"
        ) as HTMLInputElement;
        if (fileInput) {
          fileInput.value = "";
        }
        return;
      }

      const maxSize = 1048576;
      if (file.size > maxSize) {
        toast.error("El tamaño de la imagen no debe exceder 1MB");
        const fileInput = document.getElementById(
          "imageInput"
        ) as HTMLInputElement;
        if (fileInput) {
          fileInput.value = "";
        }
        return;
      }

      setSelectedImage(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (isEditing && user?.profile?.image?.data) {
      setRemovedExistingImage(true);
    }
    const fileInput = document.getElementById("imageInput") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const getFullName = (name: string, lastName: string) => {
    return `${name} ${lastName}`.trim();
  };

  const onSubmit = async (data: UserFormData) => {
    try {
      setLoading(true);

      const selectedRole = roles.find((r) => r._id === data.role);
      if (selectedRole?.name === "Distribuidor" && !getIsSuperAdmin()) {
        toast.warning(
          "Solo usuarios con rol Super Admin pueden crear usuarios con rol Distribuidor"
        );
        setLoading(false);
        return;
      }

      if (isEditing && user) {
        const updateData = {
          username: data.username,
          email: data.email,
          phone: data.phone,
          profile: {
            name: data.profile.name,
            lastName: data.profile.lastName,
            fullName: getFullName(data.profile.name, data.profile.lastName),
            estatus: data.profile.estatus ?? true,
          },
          role: data.role,
        };

        const imageToSend = removedExistingImage ? null : selectedImage;

        await usersService.updateUser(user._id, updateData, imageToSend);
        toast.success(`Usuario ${data.username} actualizado correctamente`);
      } else {
        const newUserData = {
          username: data.username,
          email: data.email,
          phone: data.phone,
          password: data.password!,
          profile: {
            name: data.profile.name,
            lastName: data.profile.lastName,
            fullName: getFullName(data.profile.name, data.profile.lastName),
            estatus: data.profile.estatus ?? true,
          },
          role: data.role,
        };

        await usersService.createUser(newUserData, selectedImage);
        toast.success(`Usuario ${data.username} creado correctamente`);
      }

      handleClose();
      onSuccess?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";

      if (isEditing) {
        toast.error(`Error al actualizar el usuario: ${errorMessage}`);
      } else {
        toast.error(`Error al crear el usuario: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setLoading(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setSelectedImage(null);
    setImagePreview(null);
    setRemovedExistingImage(false);
    setIsOpen(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  return (
    <>
      {isEditing ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          title="Editar usuario"
          onClick={(e) => {
            e.preventDefault();
            handleOpen();
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ) : (
        <Button onClick={handleOpen}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Usuario
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={(open) => !loading && setIsOpen(open)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Usuario" : "Crear Nuevo Usuario"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Modifica los datos del usuario"
                : "Completa los datos para crear un nuevo usuario"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              {/* Image Upload */}
              <div className="flex flex-col items-center gap-3">
                <Label>Imagen de Perfil</Label>
                {imagePreview ? (
                  <div className="relative">
                    <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-border relative">
                      <Image
                        src={imagePreview}
                        alt="Vista previa"
                        fill
                        style={{ objectFit: "cover" }}
                        sizes="112px"
                      />
                    </div>
                    {isEditing &&
                      !selectedImage &&
                      user?.profile?.image?.data && (
                        <p className="text-sm text-muted-foreground mt-1 text-center">
                          Imagen actual
                        </p>
                      )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={removeImage}
                      disabled={loading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-28 h-28 rounded-full border-2 border-dashed border-border flex items-center justify-center bg-muted">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="file"
                    id="imageInput"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleImageChange}
                    disabled={loading}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      document.getElementById("imageInput")?.click()
                    }
                    disabled={loading}
                  >
                    {imagePreview ? "Cambiar" : "Seleccionar"}
                  </Button>
                  {imagePreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeImage}
                      disabled={loading}
                    >
                      Quitar
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Máximo 1MB - JPG/PNG únicamente
                </p>
              </div>

              {/* Name fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profile.name">Nombre</Label>
                  <Input
                    id="profile.name"
                    placeholder="Ingresa el nombre"
                    {...register("profile.name")}
                    disabled={loading}
                    className={errors.profile?.name ? "border-destructive" : ""}
                  />
                  {errors.profile?.name && (
                    <p className="text-sm text-destructive">
                      {errors.profile.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile.lastName">Apellido</Label>
                  <Input
                    id="profile.lastName"
                    placeholder="Ingresa el apellido"
                    {...register("profile.lastName")}
                    disabled={loading}
                    className={
                      errors.profile?.lastName ? "border-destructive" : ""
                    }
                  />
                  {errors.profile?.lastName && (
                    <p className="text-sm text-destructive">
                      {errors.profile.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Contact fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Ingresa el teléfono"
                    {...register("phone")}
                    disabled={loading}
                    className={errors.phone ? "border-destructive" : ""}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Ingresa el email"
                    {...register("email")}
                    disabled={loading}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Username and Role */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Nombre de Usuario</Label>
                  <Input
                    id="username"
                    placeholder="Ingresa el nombre de usuario"
                    {...register("username")}
                    disabled={loading}
                    className={errors.username ? "border-destructive" : ""}
                  />
                  {errors.username && (
                    <p className="text-sm text-destructive">
                      {errors.username.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={loading}
                      >
                        <SelectTrigger
                          className={errors.role ? "border-destructive" : ""}
                        >
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles
                            .filter((role) => {
                              if (role.name === "Distribuidor") {
                                return getIsSuperAdmin();
                              }
                              return true;
                            })
                            .map((role) => (
                              <SelectItem key={role._id} value={role._id}>
                                {role.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.role && (
                    <p className="text-sm text-destructive">
                      {errors.role.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Password fields - Only for new users */}
              {!isEditing && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Ingresa la contraseña"
                        {...register("password")}
                        disabled={loading}
                        className={errors.password ? "border-destructive" : ""}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirma la contraseña"
                        {...register("confirmPassword")}
                        disabled={loading}
                        className={
                          errors.confirmPassword ? "border-destructive" : ""
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        disabled={loading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
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
                    {isEditing ? "Actualizando..." : "Guardando..."}
                  </>
                ) : isEditing ? (
                  "Actualizar"
                ) : (
                  "Guardar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UsersModal;
