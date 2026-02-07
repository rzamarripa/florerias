"use client";

import React, { useState, useEffect } from "react";
import { Pencil, Trash2, Search, ChevronLeft, ChevronRight, Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { salesChannelsService } from "../services/salesChannels";
import { SalesChannel } from "../types";

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

interface SalesChannelsTableProps {
  onEdit: (channel: SalesChannel) => void;
  refreshTrigger?: number;
}

const SalesChannelsTable: React.FC<SalesChannelsTableProps> = ({
  onEdit,
  refreshTrigger = 0,
}) => {
  const [channels, setChannels] = useState<SalesChannel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const response = await salesChannelsService.getAllSalesChannels({
        page: currentPage,
        limit: 10,
        status: statusFilter === "all" ? undefined : statusFilter as "active" | "inactive",
        search: searchTerm || undefined,
      });

      if (response.success) {
        setChannels(response.data);
        setTotalPages(response.pagination.pages);
        setTotal(response.pagination.total);
      }
    } catch (error) {
      console.error("Error al cargar canales de venta:", error);
      toast.error("Error al cargar los canales de venta");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, [currentPage, refreshTrigger]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1);
      fetchChannels();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, statusFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el canal de venta "${name}"?`)) {
      return;
    }

    try {
      const response = await salesChannelsService.deleteSalesChannel(id);
      if (response.success) {
        toast.success("Canal de venta eliminado exitosamente");
        fetchChannels();
      }
    } catch (error) {
      console.error("Error al eliminar canal de venta:", error);
      toast.error("Error al eliminar el canal de venta");
    }
  };

  const getCompanyName = (channel: SalesChannel) => {
    if (typeof channel.companyId === 'object' && channel.companyId !== null) {
      return channel.companyId.tradeName || channel.companyId.legalName;
    }
    return '-';
  };

  if (loading && channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-3">Cargando canales de venta...</p>
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
            placeholder="Buscar por nombre o abreviatura..."
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
            <TableHead>Canal de Venta</TableHead>
            <TableHead>Abreviatura</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead className="text-center">Estatus</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {channels.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 opacity-50" />
                  <p>
                    {searchTerm || statusFilter !== "all"
                      ? "No se encontraron canales de venta con los filtros aplicados"
                      : "No hay canales de venta registrados"}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            channels.map((channel, index) => (
              <TableRow key={channel._id}>
                <TableCell>
                  {(currentPage - 1) * 10 + index + 1}
                </TableCell>
                <TableCell className="font-medium">{channel.name}</TableCell>
                <TableCell>
                  <code className="px-2 py-1 bg-muted rounded text-sm">
                    {channel.abbreviation}
                  </code>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {getCompanyName(channel)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={channel.status === "active" ? "default" : "secondary"}>
                    {channel.status === "active" ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(channel)}
                      title="Editar canal de venta"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(channel._id, channel.name)}
                      title="Eliminar canal de venta"
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
            Mostrando {channels.length} de {total} canales de venta
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

export default SalesChannelsTable;