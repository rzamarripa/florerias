"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Warehouse,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import { storageService } from "./services/storage";
import { companiesService } from "../companies/services/companies";
import { branchesService } from "../branches/services/branches";
import { Storage } from "./types";
import { Branch } from "../branches/types";
import StorageActions from "./components/StorageActions";
import CreateStorageModal from "./components/CreateStorageModal";
import ViewStorageModal from "./components/ViewStorageModal";
import AddProductsModal from "./components/AddProductsModal";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useSearchParams } from "next/navigation";

const StoragePage: React.FC = () => {
  const searchParams = useSearchParams();
  const [storages, setStorages] = useState<Storage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [branchFilter, setBranchFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [userBranches, setUserBranches] = useState<Branch[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  // Estados para modales desde NewOrderPage
  const [showViewStorageModal, setShowViewStorageModal] =
    useState<boolean>(false);
  const [showAddProductsModal, setShowAddProductsModal] =
    useState<boolean>(false);
  const [selectedStorage, setSelectedStorage] = useState<Storage | null>(null);
  const [fromOrder, setFromOrder] = useState<boolean>(false);
  const [targetProductId, setTargetProductId] = useState<string>("");

  const { getUserId } = useUserSessionStore();
  const { getIsAdmin, hasRole } = useUserRoleStore();
  const { activeBranch } = useActiveBranchStore();
  const userId = getUserId();
  const isAdmin = getIsAdmin();
  const isManager = hasRole("Gerente");
  const isCashier = hasRole("Cajero");

  useEffect(() => {
    loadUserBranches();
  }, [userId]);

  useEffect(() => {
    if (userBranches.length > 0) {
      loadStorages(true, 1);
    }
  }, [searchTerm, branchFilter, statusFilter, userBranches, activeBranch]);

  // Detectar si viene desde NewOrderPage y abrir modal correspondiente
  useEffect(() => {
    const fromOrderParam = searchParams.get("fromOrder");
    const productId = searchParams.get("productId");
    const branchId = searchParams.get("branchId");
    const hasStockParam = searchParams.get("hasStock");

    if (fromOrderParam === "true" && productId && branchId) {
      setFromOrder(true);
      setTargetProductId(productId);

      // Cargar el storage de la sucursal
      loadStorageForOrder(branchId, productId, hasStockParam === "true");
    }
  }, [searchParams]);

  // Cargar storage cuando viene desde NewOrderPage
  const loadStorageForOrder = async (
    branchId: string,
    productId: string,
    productNotInStorage: boolean
  ) => {
    try {
      setLoading(true);
      const response = await storageService.getStorageByBranch(branchId);

      if (response.data) {
        setSelectedStorage(response.data);

        // Verificar si el producto existe en el storage
        const productExists = response.data.products.some(
          (p: any) => p.productId._id === productId || p.productId === productId
        );

        if (productExists) {
          // Producto existe pero cantidad = 0, abrir ViewStorageModal
          setShowViewStorageModal(true);
        } else {
          // Producto no existe en storage, abrir AddProductsModal
          setShowAddProductsModal(true);
        }
      } else {
        toast.error("No se encontro almacen para esta sucursal");
      }
    } catch (error: any) {
      console.error("Error loading storage for order:", error);
      toast.error("Error al cargar el almacen");
    } finally {
      setLoading(false);
    }
  };

  // Cargar las sucursales del usuario segun su rol
  const loadUserBranches = async () => {
    try {
      if (!userId) return;

      if (isAdmin) {
        // Si es admin, buscar su empresa y las sucursales de esa empresa
        const company = await companiesService.getMyCompany();
        if (company && company.branches) {
          // Cargar todas las sucursales de la empresa
          const branchesResponse = await branchesService.getAllBranches({
            limit: 100,
          });
          setUserBranches(branchesResponse.data);
        }
      } else if (isManager || isCashier) {
        // Si es gerente o cajero, buscar solo su(s) sucursal(es)
        const branchesResponse = await branchesService.getUserBranches();
        setUserBranches(branchesResponse.data);
      }
    } catch (error: any) {
      console.error("Error loading user branches:", error);
      toast.error(error.message || "Error al cargar sucursales del usuario");
    }
  };

  const loadStorages = async (
    isInitial: boolean,
    page: number = pagination.page
  ) => {
    try {
      if (isInitial) {
        setLoading(true);
      }

      // Si no hay sucursales del usuario, no cargar nada
      if (userBranches.length === 0) {
        setStorages([]);
        setLoading(false);
        return;
      }

      const filters: any = {
        page,
        limit: pagination.limit,
      };

      if (searchTerm) {
        filters.search = searchTerm;
      }

      // Para administradores: usar activeBranch del store
      // Para otros roles: usar branchFilter
      if (isAdmin && activeBranch) {
        filters.branch = activeBranch._id;
      } else if (!isAdmin && branchFilter) {
        filters.branch = branchFilter;
      }

      if (statusFilter) {
        filters.isActive = statusFilter === "true";
      }

      // Cargar todos los storages
      const response = await storageService.getAllStorages(filters);

      if (response.data) {
        // Filtrar los storages segun las sucursales del usuario
        const branchIds = userBranches.map((b) => b._id);
        const filteredStorages = response.data.filter((storage) => {
          const storageBranchId =
            typeof storage.branch === "string"
              ? storage.branch
              : storage.branch._id;
          return branchIds.includes(storageBranchId);
        });

        setStorages(filteredStorages);

        // Ajustar la paginacion
        setPagination({
          ...response.pagination,
          total: filteredStorages.length,
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar los almacenes");
      console.error("Error loading storages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleBranchFilterChange = (value: string): void => {
    setBranchFilter(value === "all" ? "" : value);
  };

  const handleStatusFilterChange = (value: string): void => {
    setStatusFilter(value === "all" ? "" : value);
  };

  const handlePageChange = (page: number) => {
    loadStorages(true, page);
  };

  const handleStorageUpdated = () => {
    loadStorages(false);
  };

  const getBranchName = (storage: Storage): string => {
    if (typeof storage.branch === "string") {
      return "N/A";
    }
    return storage.branch.branchName;
  };

  const getBranchCode = (storage: Storage): string | undefined => {
    if (typeof storage.branch === "string") {
      return undefined;
    }
    return storage.branch.branchCode;
  };

  const getManagerName = (storage: Storage): string => {
    if (!storage.warehouseManager) {
      return "N/A";
    }
    if (typeof storage.warehouseManager === "string") {
      return "N/A";
    }
    return storage.warehouseManager.profile.fullName;
  };

  const getProductsCount = (storage: Storage): number => {
    return storage.products.length;
  };

  const getTotalQuantity = (storage: Storage): number => {
    return storage.products.reduce((sum, item) => sum + item.quantity, 0);
  };

  const formatDate = (date: string | null): string => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto py-2">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="mb-1 font-bold text-2xl">Almacenes</h2>
          <p className="text-muted-foreground mb-0">
            Gestiona los almacenes y su inventario
          </p>
        </div>
        {(isAdmin || isManager || isCashier) && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4"
          >
            <Plus size={20} />
            Nuevo Almacen
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-2 rounded-lg">
        <CardContent className="p-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por sucursal..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 bg-muted/50 border-0"
              />
            </div>

            {/* Filtro de sucursal solo para NO administradores (gerentes, etc.) */}
            {!isAdmin && (
              <Select
                value={branchFilter || "all"}
                onValueChange={handleBranchFilterChange}
              >
                <SelectTrigger className="bg-muted/50 border-0">
                  <SelectValue placeholder="Todas las sucursales" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las sucursales</SelectItem>
                  {userBranches.map((branch) => (
                    <SelectItem key={branch._id} value={branch._id}>
                      {branch.branchName}{" "}
                      {branch.branchCode ? `(${branch.branchCode})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select
              value={statusFilter || "all"}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger className={`bg-muted/50 border-0 ${!isAdmin ? "" : "md:col-span-2"}`}>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="true">Activos</SelectItem>
                <SelectItem value="false">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm rounded-lg">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground mt-3">Cargando almacenes...</p>
            </div>
          ) : (
            <div className="rounded-md">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="px-2 py-2 font-semibold text-muted-foreground">#</TableHead>
                    <TableHead className="px-2 py-2 font-semibold text-muted-foreground">
                      SUCURSAL
                    </TableHead>
                    <TableHead className="px-2 py-2 font-semibold text-muted-foreground">
                      GERENTE
                    </TableHead>
                    <TableHead className="px-2 py-2 font-semibold text-muted-foreground">
                      PRODUCTOS
                    </TableHead>
                    <TableHead className="px-2 py-2 font-semibold text-muted-foreground">
                      CANTIDAD TOTAL
                    </TableHead>
                    <TableHead className="px-2 py-2 font-semibold text-muted-foreground">
                      ULTIMO INGRESO
                    </TableHead>
                    <TableHead className="px-2 py-2 font-semibold text-muted-foreground">ESTADO</TableHead>
                    <TableHead className="px-2 py-2 font-semibold text-muted-foreground text-center">
                      ACCIONES
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {storages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        <Warehouse size={48} className="mb-3 opacity-50 mx-auto" />
                        <p className="mb-0">No se encontraron almacenes</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    storages.map((storage, index) => (
                      <TableRow
                        key={storage._id}
                        className="border-b border-muted/30"
                      >
                        <TableCell className="px-2 py-2">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <div>
                            <div className="font-semibold">
                              {getBranchName(storage)}
                            </div>
                            {getBranchCode(storage) && (
                              <small className="text-muted-foreground">
                                {getBranchCode(storage)}
                              </small>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2">{getManagerName(storage)}</TableCell>
                        <TableCell className="px-2 py-2">
                          <Badge variant="secondary" className="rounded-full">
                            {getProductsCount(storage)}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <Badge className="rounded-full">
                            {getTotalQuantity(storage)}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <small>{formatDate(storage.lastIncome)}</small>
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <Badge
                            variant={storage.isActive ? "default" : "destructive"}
                            className="px-2.5 py-0.5 rounded-xl font-medium"
                          >
                            {storage.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <StorageActions
                            storage={storage}
                            onStorageUpdated={handleStorageUpdated}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && storages.length > 0 && (
            <div className="flex justify-between items-center px-2 py-2 border-t">
              <p className="text-muted-foreground mb-0 text-sm">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                de {pagination.total} almacenes
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="rounded-lg"
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
                  className="rounded-lg"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      {(isAdmin || isManager || isCashier) && (
        <CreateStorageModal
          show={showCreateModal}
          onHide={() => setShowCreateModal(false)}
          onStorageSaved={handleStorageUpdated}
          branches={userBranches}
        />
      )}

      {/* View Storage Modal - Cuando viene desde Order */}
      {selectedStorage && (
        <ViewStorageModal
          show={showViewStorageModal}
          onHide={() => {
            setShowViewStorageModal(false);
            setSelectedStorage(null);
            setFromOrder(false);
          }}
          storage={selectedStorage}
          onStorageUpdated={handleStorageUpdated}
          fromOrder={fromOrder}
          targetProductId={targetProductId}
        />
      )}

      {/* Add Products Modal - Cuando viene desde Order */}
      {selectedStorage && (
        <AddProductsModal
          show={showAddProductsModal}
          onHide={() => {
            setShowAddProductsModal(false);
            setSelectedStorage(null);
            setFromOrder(false);
          }}
          storage={selectedStorage}
          onProductsAdded={handleStorageUpdated}
          fromOrder={fromOrder}
          targetProductId={targetProductId}
        />
      )}
    </div>
  );
};

export default StoragePage;
