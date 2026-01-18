"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Role } from "../roles/types";
import UserActions from "./components/Actions";
import UserModal from "./components/UserModal";
import { usersService } from "./services/users";
import { User } from "./types";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useUserRoleStore } from "@/stores/userRoleStore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const UsersPage: React.FC = () => {
  const { activeBranch } = useActiveBranchStore();
  const { hasRole } = useUserRoleStore();
  const isAdmin = hasRole("Administrador") || hasRole("Admin");

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const loadRoles = async () => {
    try {
      const response = await usersService.getAllRoles({ limit: 100 });
      if (response.data) {
        setRoles(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar los roles");
      console.error("Error loading roles:", error);
    }
  };

  const loadUsers = async (
    isInitial: boolean,
    page: number = pagination.page
  ) => {
    try {
      if (isInitial) {
        setLoading(true);
      }

      const params: any = {
        page,
        limit: pagination.limit,
        ...(searchTerm && { username: searchTerm }),
        ...(statusFilter && statusFilter !== "all" && { estatus: statusFilter }),
      };

      if (isAdmin && activeBranch) {
        params.branchId = activeBranch._id;
      }

      const response = await usersService.getAllUsers(params);

      if (response.data) {
        setUsers(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar los usuarios");
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    loadUsers(true, 1);
  }, [searchTerm, statusFilter, activeBranch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (value: string): void => {
    setStatusFilter(value);
  };

  const handlePageChange = (page: number) => {
    loadUsers(true, page);
  };

  const handleUserSaved = () => {
    loadUsers(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="Usuarios"
        description="Gestiona los usuarios del sistema"
        badge={
          activeBranch ? (
            <Badge variant="secondary">Sucursal: {activeBranch.branchName}</Badge>
          ) : undefined
        }
        action={{
          label: "Agregar Usuario",
          onClick: () => {},
          customElement: <UserModal roles={roles} onSuccess={handleUserSaved} />,
        }}
      />

      {/* Filters & Table */}
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row gap-4 p-4 border-b">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Activos</SelectItem>
                <SelectItem value="false">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground mt-3">Cargando usuarios...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-12 text-muted-foreground"
                      >
                        <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <div>No se encontraron usuarios</div>
                        <p className="text-sm">
                          Intenta ajustar los filtros de búsqueda
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user, index) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {user?.profile?.image?.data ? (
                                <AvatarImage
                                  src={`data:${user.profile.image.contentType};base64,${user.profile.image.data}`}
                                  alt={user.username}
                                />
                              ) : null}
                              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                                {user.profile?.name?.charAt(0)?.toUpperCase() ||
                                  user.username?.charAt(0)?.toUpperCase() ||
                                  "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {user.profile?.name || user.username}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {user.profile?.fullName}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email || "-"}</TableCell>
                        <TableCell>{user.phone || "-"}</TableCell>
                        <TableCell>
                          {typeof user.role === "object"
                            ? user.role.name
                            : user.role || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.profile.estatus ? "default" : "destructive"
                            }
                          >
                            {user.profile.estatus ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <UserActions
                            user={user}
                            roles={roles}
                            onUserSaved={handleUserSaved}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {users.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {users.length} de {pagination.total} registros
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <span className="text-sm px-2">
                      Página {pagination.page} de {pagination.pages || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersPage;
