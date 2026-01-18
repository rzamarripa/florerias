"use client";

import React, { useEffect, useState } from "react";
import { Plus, Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { productListsService } from "./services/productLists";
import { ProductList, ProductListFilters } from "./types";
import ProductListActions from "./components/ProductListActions";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { branchesService } from "../branches/services/branches";
import { Branch } from "../branches/types";
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

const ProductListsPage: React.FC = () => {
  const [productLists, setProductLists] = useState<ProductList[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });
  const router = useRouter();
  const { activeBranch } = useActiveBranchStore();
  const { hasRole } = useUserRoleStore();
  const isAdmin = hasRole("Administrador") || hasRole("Admin");
  const isManager = hasRole("Gerente");
  const [managerBranch, setManagerBranch] = useState<Branch | null>(null);

  // Funcion para formatear numeros con separacion de miles
  const formatNumber = (num: number): string => {
    return num.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const loadProductLists = async (
    isInitial: boolean,
    page: number = pagination.page
  ) => {
    try {
      if (isInitial) {
        setLoading(true);
      }

      const filters: ProductListFilters = {
        page,
        limit: pagination.limit,
      };

      if (searchTerm) {
        filters.name = searchTerm;
      }

      // Filtrar por sucursal segun el rol
      if (isManager && managerBranch) {
        filters.branchId = managerBranch._id;
        console.log("🔍 [ProductLists] Filtrando por sucursal del gerente:", managerBranch.branchName, managerBranch._id);
      } else if (isAdmin && activeBranch) {
        filters.branchId = activeBranch._id;
        console.log("🔍 [ProductLists] Filtrando por sucursal activa del admin:", activeBranch.branchName, activeBranch._id);
      } else {
        console.log("🔍 [ProductLists] Sin filtro de sucursal - isAdmin:", isAdmin, "isManager:", isManager, "activeBranch:", activeBranch, "managerBranch:", managerBranch);
      }

      console.log("🔍 [ProductLists] Filtros enviados:", filters);
      const response = await productListsService.getAllProductLists(filters);

      if (response.data) {
        setProductLists(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar las listas de productos");
      console.error("Error loading product lists:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar sucursal del gerente si aplica
  const loadManagerBranch = async () => {
    try {
      const response = await branchesService.getUserBranches();
      if (response.success && response.data && response.data.length > 0) {
        setManagerBranch(response.data[0]);
        console.log("🔍 [ProductLists] Sucursal del gerente cargada:", response.data[0].branchName);
      }
    } catch (err: any) {
      console.error("Error al cargar sucursal del gerente:", err);
      toast.error("Error al cargar la sucursal del gerente");
    }
  };

  useEffect(() => {
    if (isManager) {
      loadManagerBranch();
    }
  }, [isManager]);

  useEffect(() => {
    // Solo cargar si tenemos la sucursal correspondiente segun el rol
    if (isManager && !managerBranch) {
      return; // Esperar a que se cargue la sucursal del gerente
    }
    loadProductLists(true, 1);
  }, [searchTerm, activeBranch, managerBranch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (page: number) => {
    loadProductLists(true, page);
  };

  const handleNewProductList = () => {
    router.push("/catalogos/listas-productos/nuevo");
  };

  // Calculos para cada lista
  const calculateTotals = (productList: ProductList) => {
    let totalProducts = productList.products.length;
    let totalGastado = 0;
    let gananciasBrutas = 0;

    productList.products.forEach((product) => {
      // Total gastado = totalCosto (que ya incluye labour)
      totalGastado += product.totalCosto;

      // Ganancias brutas = totalVenta de cada producto
      gananciasBrutas += product.totalVenta;
    });

    // Ganancias netas = Ganancias brutas - Total gastado
    const gananciasNetas = gananciasBrutas - totalGastado;

    return {
      totalProducts,
      totalGastado,
      gananciasBrutas,
      gananciasNetas,
    };
  };

  return (
    <div className="container-fluid py-2">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="mb-1 font-bold text-2xl">Listas de Productos</h2>
          <p className="text-muted-foreground mb-0">Gestiona las listas de productos</p>
        </div>
        <Button
          onClick={handleNewProductList}
          className="flex items-center gap-2 px-4"
        >
          <Plus size={20} />
          Nueva Lista
        </Button>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <div className="relative max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nombre de lista..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="mt-3 text-muted-foreground">Cargando listas...</p>
            </div>
          ) : productLists.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-0">
                No se encontraron listas de productos
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="px-2 py-2">Nombre</TableHead>
                      <TableHead className="px-2 py-2">Sucursal</TableHead>
                      <TableHead className="px-2 py-2">Fecha Creacion</TableHead>
                      <TableHead className="px-2 py-2">Fecha Expiracion</TableHead>
                      <TableHead className="px-2 py-2 text-right">
                        Total Gastado
                      </TableHead>
                      <TableHead className="px-2 py-2 text-right">
                        Ganancias Brutas
                      </TableHead>
                      <TableHead className="px-2 py-2 text-right">
                        Ganancias Netas
                      </TableHead>
                      <TableHead className="px-2 py-2 text-center">Estado</TableHead>
                      <TableHead className="px-2 py-2 text-center">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productLists.map((productList) => {
                      const totals = calculateTotals(productList);
                      return (
                        <TableRow key={productList._id} className="hover:bg-muted/50">
                          <TableCell className="px-2 py-2">
                            <div className="font-semibold">
                              {productList.name}
                            </div>
                            <small className="text-muted-foreground">
                              {productList.company?.tradeName ||
                                productList.company?.legalName}
                            </small>
                          </TableCell>
                          <TableCell className="px-2 py-2">
                            <div className="font-semibold">
                              {productList.branch && typeof productList.branch === 'object'
                                ? (productList.branch as any).branchName || 'Sin nombre'
                                : 'Sin sucursal'}
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-2">
                            {new Date(productList.createdAt).toLocaleDateString(
                              "es-MX",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </TableCell>
                          <TableCell className="px-2 py-2">
                            {new Date(
                              productList.expirationDate
                            ).toLocaleDateString("es-MX", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </TableCell>
                          <TableCell className="px-2 py-2 text-right text-red-600 font-semibold">
                            ${formatNumber(totals.totalGastado)}
                          </TableCell>
                          <TableCell className="px-2 py-2 text-right text-primary font-semibold">
                            ${formatNumber(totals.gananciasBrutas)}
                          </TableCell>
                          <TableCell className="px-2 py-2 text-right font-bold">
                            <span
                              className={
                                totals.gananciasNetas >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              ${formatNumber(totals.gananciasNetas)}
                            </span>
                          </TableCell>
                          <TableCell className="px-2 py-2 text-center">
                            <Badge
                              variant={productList.status ? "default" : "secondary"}
                              className={productList.status ? "bg-green-600" : ""}
                            >
                              {productList.status ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-2 py-2">
                            <ProductListActions
                              productList={productList}
                              onStatusChange={() => loadProductLists(false)}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-between items-center px-2 py-2 border-t">
                  <div className="text-muted-foreground text-sm">
                    Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{" "}
                    de {pagination.total} resultados
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    <div className="flex items-center px-3">
                      Pagina {pagination.page} de {pagination.pages}
                    </div>
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductListsPage;
