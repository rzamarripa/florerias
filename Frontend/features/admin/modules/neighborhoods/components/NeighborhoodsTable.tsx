"use client";

import React, { useState, useEffect } from "react";
import { Pencil, Trash2, Search, ChevronLeft, ChevronRight, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { neighborhoodsService } from "../services/neighborhoods";
import { Neighborhood } from "../types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

interface NeighborhoodsTableProps {
  onEdit: (neighborhood: Neighborhood) => void;
  refreshTrigger?: number;
}

const NeighborhoodsTable: React.FC<NeighborhoodsTableProps> = ({
  onEdit,
  refreshTrigger = 0,
}) => {
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchNeighborhoods = async () => {
    try {
      setLoading(true);
      const response = await neighborhoodsService.getAllNeighborhoods({
        page: currentPage,
        limit: 10,
        status: statusFilter === "all" ? undefined : statusFilter as "active" | "inactive",
        search: searchTerm || undefined,
      });

      if (response.success) {
        setNeighborhoods(response.data);
        setTotalPages(response.pagination.pages);
        setTotal(response.pagination.total);
      }
    } catch (error) {
      console.error("Error al cargar colonias:", error);
      toast.error("Error al cargar las colonias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNeighborhoods();
  }, [currentPage, refreshTrigger]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1);
      fetchNeighborhoods();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, statusFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar la colonia "${name}"?`)) {
      return;
    }

    try {
      const response = await neighborhoodsService.deleteNeighborhood(id);
      if (response.success) {
        toast.success("Colonia eliminada exitosamente");
        fetchNeighborhoods();
      }
    } catch (error) {
      console.error("Error al eliminar colonia:", error);
      toast.error("Error al eliminar la colonia");
    }
  };

  if (loading && neighborhoods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-3">Cargando colonias...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nombre de colonia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="w-full md:w-48">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos los estatus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estatus</SelectItem>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabla */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Colonia</TableHead>
            <TableHead className="text-right">Precio Entrega</TableHead>
            <TableHead className="text-center">Estatus</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {neighborhoods.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-12">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <MapPin className="h-12 w-12 opacity-50" />
                  <p>
                    {searchTerm || statusFilter !== "all"
                      ? "No se encontraron colonias con los filtros aplicados"
                      : "No hay colonias registradas"}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            neighborhoods.map((neighborhood, index) => (
              <TableRow key={neighborhood._id}>
                <TableCell>
                  {(currentPage - 1) * 10 + index + 1}
                </TableCell>
                <TableCell className="font-medium">{neighborhood.name}</TableCell>
                <TableCell className="text-right font-medium">
                  ${neighborhood.priceDelivery.toFixed(2)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={neighborhood.status === "active" ? "default" : "secondary"}>
                    {neighborhood.status === "active" ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(neighborhood)}
                      title="Editar colonia"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(neighborhood._id, neighborhood.name)}
                      title="Eliminar colonia"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Mostrando {neighborhoods.length} de {total} colonias
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => prev - 1)}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={currentPage === totalPages || loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NeighborhoodsTable;
