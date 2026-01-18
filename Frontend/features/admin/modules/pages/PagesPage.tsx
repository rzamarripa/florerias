"use client";

import { FileText, Plus, Search, ChevronLeft, ChevronRight, Edit2, XCircle, CheckCircle, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import CreatePageModal from "./components/AddPageModal";
import EditPageModal from "./components/EditPagesModal";
import { Page, pagesService } from "./services/pages";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

const PaginasTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("todos");
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [togglingPages, setTogglingPages] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const fetchPages = async (showLoading: boolean = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      const response = await pagesService.getAllPages({
        page: pagination.page,
        limit: pagination.limit,
        ...(searchTerm && { name: searchTerm }),
        ...(selectedType === "activos" && { status: "true" }),
        ...(selectedType === "inactivos" && { status: "false" }),
      });

      if (response.success && response.data) {
        setPages(response.data);
        setPagination({
          page: 1,
          limit: 15,
          total: response.data.length,
          pages: Math.ceil(response.data.length / 15),
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al cargar las páginas";
      setError(errorMessage);
      toast.error("Error al cargar las páginas");
      console.error("Error fetching pages:", err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchPages(true);
  }, [searchTerm, selectedType]);

  const getPageStatus = (id: string): boolean => {
    return pages.find((page) => page._id === id)?.status || false;
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleTypeChange = (value: string): void => {
    setSelectedType(value);
  };

  const handleNewPageClick = (): void => {
    setShowCreateModal(true);
  };

  const handleCloseModal = (): void => {
    setShowCreateModal(false);
  };

  const handlePageCreated = (): void => {
    fetchPages(false);
  };

  const handleEditPageClick = (pageId: string): void => {
    setSelectedPageId(pageId);
    setShowEditModal(true);
  };

  const handleCloseEditModal = (): void => {
    setShowEditModal(false);
    setSelectedPageId(null);
  };

  const handlePageUpdated = (): void => {
    fetchPages(false);
  };

  const clearError = (): void => {
    setError(null);
  };

  const handleTogglePage = async (id: string) => {
    try {
      setTogglingPages(prev => new Set(prev).add(id));
      const currentPage = pages.find((page) => page._id === id);

      if (!currentPage) {
        toast.error("Página no encontrada");
        return;
      }

      if (currentPage.status) {
        const response = await pagesService.deletePage(id);
        if (response.success) {
          toast.success(
            `Página "${currentPage.name}" desactivada correctamente`
          );
          fetchPages(false);
        } else {
          throw new Error(response.message || "Error al desactivar la página");
        }
      } else {
        const response = await pagesService.activatePage(id);
        if (response.success) {
          toast.success(`Página "${currentPage.name}" activada correctamente`);
          fetchPages(false);
        } else {
          throw new Error(response.message || "Error al activar la página");
        }
      }
    } catch (err) {
      const currentPage = pages.find((page) => page._id === id);
      const pageName = currentPage?.name || "la página";
      const action = currentPage?.status ? "desactivar" : "activar";
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";

      console.error("Error toggling page status:", err);
      toast.error(`Error al ${action} ${pageName}: ${errorMessage}`);
    } finally {
      setTogglingPages(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="Páginas"
        description="Gestiona las páginas del sistema"
        action={{
          label: "Nueva Página",
          icon: <Plus className="h-4 w-4" />,
          onClick: handleNewPageClick,
        }}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            <strong>Error:</strong> {error}
            <Button
              variant="ghost"
              size="sm"
              className="ml-2"
              onClick={clearError}
            >
              Cerrar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters & Table */}
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row gap-4 p-4 border-b">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar páginas..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>

            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="activos">Páginas activas</SelectItem>
                <SelectItem value="inactivos">Páginas inactivas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground mt-3">Cargando páginas...</p>
            </div>
          ) : pages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-3 opacity-50" />
              <div>No hay páginas registradas</div>
              <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Ruta</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-center">Estatus</TableHead>
                    <TableHead className="text-center">Fecha creación</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((pagina, index) => (
                    <TableRow key={pagina._id}>
                      <TableCell className="text-center text-muted-foreground">
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">{pagina.name}</TableCell>
                      <TableCell>{pagina.path}</TableCell>
                      <TableCell>{pagina.description || "-"}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={pagina.status ? "default" : "destructive"}>
                          {pagina.status ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {new Date(pagina.createdAt).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Editar página"
                            onClick={() => handleEditPageClick(pagina._id)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title={
                              getPageStatus(pagina._id)
                                ? "Desactivar página"
                                : "Activar página"
                            }
                            onClick={() => handleTogglePage(pagina._id)}
                            disabled={togglingPages.has(pagina._id)}
                          >
                            {togglingPages.has(pagina._id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : getPageStatus(pagina._id) ? (
                              <XCircle className="h-4 w-4 text-destructive" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pages.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {pages.length} de {pagination.total} registros
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

      <CreatePageModal
        show={showCreateModal}
        onHide={handleCloseModal}
        onPageCreated={handlePageCreated}
      />

      <EditPageModal
        show={showEditModal}
        onHide={handleCloseEditModal}
        onPageUpdated={handlePageUpdated}
        pageId={selectedPageId}
      />
    </div>
  );
};

export default PaginasTable;
