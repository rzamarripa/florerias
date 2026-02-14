"use client";

import { Search, ChevronLeft, ChevronRight, Wrench, Loader2, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { networksUsersService } from "./services/networksUsers";
import {
  NetworksUser,
  NetworksUserFilters,
  CreateNetworksUserData,
  UpdateNetworksUserData,
} from "./types";
import { useUserRoleStore } from "@/stores/userRoleStore";
import Actions from "./components/Actions";
import NetworksUserModal from "./components/NetworksUserModal";

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

const NetworksUsersPage: React.FC = () => {
  const { getIsAdmin, getIsManager } = useUserRoleStore();
  const canCreateNetworksUser = getIsAdmin() || getIsManager();
  const [users, setUsers] = useState<NetworksUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<NetworksUser | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const loadNetworksUsers = async (
    isInitial: boolean,
    page: number = pagination.page
  ) => {
    try {
      if (isInitial) {
        setLoading(true);
      }

      const filters: NetworksUserFilters = {
        page,
        limit: pagination.limit,
      };

      if (searchTerm) {
        filters.search = searchTerm;
      }

      if (statusFilter) {
        filters.estatus = statusFilter === "true";
      }

      const response = await networksUsersService.getAllNetworksUsers(filters);

      if (response.data) {
        setUsers(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar los usuarios de redes");
      console.error("Error loading production users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNetworksUsers(true, 1);
  }, [searchTerm, statusFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (value: string): void => {
    setStatusFilter(value);
  };

  const handlePageChange = (page: number) => {
    loadNetworksUsers(true, page);
  };

  const handleCreateNetworksUser = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user: NetworksUser) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleToggleStatus = async (user: NetworksUser) => {
    try {
      if (user.profile.estatus) {
        await networksUsersService.deactivateNetworksUser(user._id);
        toast.success("Usuario de redes desactivado exitosamente");
      } else {
        await networksUsersService.activateNetworksUser(user._id);
        toast.success("Usuario de redes activado exitosamente");
      }
      loadNetworksUsers(false);
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar el estado del usuario");
    }
  };

  const handleSaveUser = async (
    data: CreateNetworksUserData | UpdateNetworksUserData
  ) => {
    try {
      setModalLoading(true);
      if (selectedUser) {
        // Modo edición
        await networksUsersService.updateNetworksUser(selectedUser._id, data as UpdateNetworksUserData);
        toast.success("Usuario de redes actualizado exitosamente");
      } else {
        // Modo creación
        await networksUsersService.createNetworksUser(data as CreateNetworksUserData);
        toast.success("Usuario de redes creado exitosamente");
      }
      setShowModal(false);
      loadNetworksUsers(false);
    } catch (error: any) {
      toast.error(error.message || `Error al ${selectedUser ? 'actualizar' : 'crear'} el usuario`);
    } finally {
      setModalLoading(false);
    }
  };

  const getPageNumbers = () => {
    const { page, pages } = pagination;
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(pages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < pages - 1) {
      rangeWithDots.push("...", pages);
    } else if (pages > 1) {
      rangeWithDots.push(pages);
    }

    return rangeWithDots;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="Usuarios de Redes"
        description="Gestiona los usuarios del área de redes y marketing"
        action={canCreateNetworksUser ? {
          label: "Nuevo Usuario de Redes",
          icon: <Plus className="h-4 w-4" />,
          onClick: handleCreateNetworksUser,
        } : undefined}
      />

      {/* Filters & Table */}
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row gap-4 p-4 border-b">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar usuarios de redes..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter || "all"}
              onValueChange={(value) => handleStatusFilterChange(value === "all" ? "" : value)}
            >
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
              <p className="text-muted-foreground mt-3">Cargando usuarios de redes...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Sucursal</TableHead>
                    <TableHead>Estatus</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-12 text-muted-foreground"
                      >
                        <Wrench className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <div>No se encontraron usuarios de redes</div>
                        <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user, index) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.profile.fullName}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(user.createdAt)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">@{user.username}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="truncate max-w-[200px]">{user.email}</div>
                        </TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell>
                          {user.branch ? (
                            <div>
                              <div className="font-medium">{user.branch.branchName}</div>
                              <div className="text-sm text-muted-foreground">
                                {user.branch.branchCode}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sin sucursal</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.profile.estatus ? "default" : "destructive"}>
                            {user.profile.estatus ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Actions
                            user={user}
                            onEdit={handleEditUser}
                            onToggleStatus={handleToggleStatus}
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

      <NetworksUserModal
        show={showModal}
        onHide={() => setShowModal(false)}
        user={selectedUser}
        onSave={handleSaveUser}
        loading={modalLoading}
      />
    </div>
  );
};

export default NetworksUsersPage;