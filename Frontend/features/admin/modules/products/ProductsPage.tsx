"use client";

import React, { useEffect, useState } from "react";
import { Plus, Package, Search, ChevronLeft, ChevronRight, Eye, Edit, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { productsService } from "./services/products";
import { Product, ProductFilters } from "./types";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });
  const router = useRouter();

  const loadProducts = async (isInitial: boolean, page: number = pagination.page) => {
    try {
      if (isInitial) {
        setLoading(true);
      }

      const filters: ProductFilters = {
        page,
        limit: pagination.limit,
      };

      if (searchTerm) {
        filters.nombre = searchTerm;
      }

      if (statusFilter) {
        filters.estatus = statusFilter === "true";
      }

      const response = await productsService.getAllProducts(filters);

      if (response.data) {
        setProducts(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar los productos");
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(true, 1);
  }, [searchTerm, statusFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (value: string): void => {
    setStatusFilter(value === "all" ? "" : value);
  };

  const handlePageChange = (page: number) => {
    loadProducts(true, page);
  };

  const handleNewProduct = () => {
    router.push("/catalogos/productos/nuevo");
  };

  const handleEditProduct = (productId: string) => {
    router.push(`/catalogos/productos/${productId}`);
  };

  const handleViewProduct = (productId: string) => {
    router.push(`/catalogos/productos/ver/${productId}`);
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      if (product.estatus) {
        await productsService.deactivateProduct(product._id);
        toast.success("Producto desactivado exitosamente");
      } else {
        await productsService.activateProduct(product._id);
        toast.success("Producto activado exitosamente");
      }
      loadProducts(false);
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar el estado del producto");
    }
  };

  return (
    <div className="container mx-auto py-2">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">Productos</h2>
          <p className="text-muted-foreground">Gestiona el catalogo de productos</p>
        </div>
        <Button onClick={handleNewProduct} className="flex items-center gap-2 px-4">
          <Plus size={20} />
          Nuevo Producto
        </Button>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row gap-4 p-4 border-b">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10"
              />
              <Input
                type="text"
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter || "all"}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="true">Activos</SelectItem>
                <SelectItem value="false">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground mt-3">Cargando productos...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold text-muted-foreground">ORDEN</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">NOMBRE</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">DESCRIPCION</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">COSTO</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">PRECIO</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">ESTATUS</TableHead>
                  <TableHead className="font-semibold text-muted-foreground text-center">ACCIONES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Package size={48} className="mx-auto mb-3 opacity-50 text-muted-foreground" />
                      <div className="text-muted-foreground">No se encontraron productos</div>
                      <small className="text-muted-foreground">Intenta ajustar los filtros de busqueda</small>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell>{product.orden}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.imagen ? (
                            <img
                              src={product.imagen}
                              alt={product.nombre}
                              className="rounded border w-10 h-10 object-cover min-w-[40px]"
                            />
                          ) : (
                            <div className="bg-muted rounded border flex items-center justify-center w-10 h-10 min-w-[40px]">
                              <Package size={20} className="text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold">{product.nombre}</div>
                            <div className="text-muted-foreground text-sm">{product.unidad}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className="truncate max-w-[300px]"
                          title={product.descripcion}
                        >
                          {product.descripcion || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        ${(product.totalCosto || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-primary font-medium">
                        ${(product.totalVenta || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={product.estatus ? "default" : "destructive"}
                          className="rounded-full"
                        >
                          {product.estatus ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleViewProduct(product._id)}
                            title="Ver"
                          >
                            <Eye size={16} className="text-blue-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleEditProduct(product._id)}
                            title="Editar"
                          >
                            <Edit size={16} className="text-yellow-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleToggleStatus(product)}
                            title={product.estatus ? "Desactivar" : "Activar"}
                          >
                            {product.estatus ? (
                              <ToggleRight size={16} className="text-red-500" />
                            ) : (
                              <ToggleLeft size={16} className="text-green-500" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Paginacion */}
          {!loading && products.length > 0 && (
            <div className="flex justify-between items-center px-4 py-3 border-t">
              <p className="text-muted-foreground text-sm">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} productos
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft size={16} />
                </Button>
                <span className="px-3 py-1 text-sm">
                  Pagina {pagination.page} de {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductsPage;
