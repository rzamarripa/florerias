"use client";

import React, { useEffect, useState } from "react";
import { Button, Table, Badge, Form, InputGroup, Spinner } from "react-bootstrap";
import { Plus, Search, ChevronLeft, ChevronRight, Warehouse } from "lucide-react";
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
  const [showViewStorageModal, setShowViewStorageModal] = useState<boolean>(false);
  const [showAddProductsModal, setShowAddProductsModal] = useState<boolean>(false);
  const [selectedStorage, setSelectedStorage] = useState<Storage | null>(null);
  const [fromOrder, setFromOrder] = useState<boolean>(false);
  const [targetProductId, setTargetProductId] = useState<string>("");

  const { getUserId } = useUserSessionStore();
  const { getIsAdmin, hasRole } = useUserRoleStore();
  const { activeBranch } = useActiveBranchStore();
  const userId = getUserId();
  const isAdmin = getIsAdmin();
  const isManager = hasRole("Gerente");

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
    const fromOrderParam = searchParams.get('fromOrder');
    const productId = searchParams.get('productId');
    const branchId = searchParams.get('branchId');
    const hasStockParam = searchParams.get('hasStock');

    if (fromOrderParam === 'true' && productId && branchId) {
      setFromOrder(true);
      setTargetProductId(productId);

      // Cargar el storage de la sucursal
      loadStorageForOrder(branchId, productId, hasStockParam === 'true');
    }
  }, [searchParams]);

  // Cargar storage cuando viene desde NewOrderPage
  const loadStorageForOrder = async (branchId: string, productId: string, productNotInStorage: boolean) => {
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
        toast.error("No se encontró almacén para esta sucursal");
      }
    } catch (error: any) {
      console.error("Error loading storage for order:", error);
      toast.error("Error al cargar el almacén");
    } finally {
      setLoading(false);
    }
  };

  // Cargar las sucursales del usuario según su rol
  const loadUserBranches = async () => {
    try {
      if (!userId) return;

      if (isAdmin) {
        // Si es admin, buscar su empresa y las sucursales de esa empresa
        const company = await companiesService.getMyCompany();
        if (company && company.branches) {
          // Cargar todas las sucursales de la empresa
          const branchesResponse = await branchesService.getAllBranches({ limit: 100 });
          setUserBranches(branchesResponse.data);
        }
      } else if (isManager) {
        // Si es gerente, buscar solo su sucursal
        const branchesResponse = await branchesService.getUserBranches();
        setUserBranches(branchesResponse.data);
      }
    } catch (error: any) {
      console.error("Error loading user branches:", error);
      toast.error(error.message || "Error al cargar sucursales del usuario");
    }
  };

  const loadStorages = async (isInitial: boolean, page: number = pagination.page) => {
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
        // Filtrar los storages según las sucursales del usuario
        const branchIds = userBranches.map((b) => b._id);
        const filteredStorages = response.data.filter((storage) => {
          const storageBranchId = typeof storage.branch === "string"
            ? storage.branch
            : storage.branch._id;
          return branchIds.includes(storageBranchId);
        });

        setStorages(filteredStorages);

        // Ajustar la paginación
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

  const handleBranchFilterChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setBranchFilter(e.target.value);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setStatusFilter(e.target.value);
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
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold">Almacenes</h2>
          <p className="text-muted mb-0">Gestiona los almacenes y su inventario</p>
        </div>
        {isAdmin && (
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="d-flex align-items-center gap-2 px-4"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: "10px",
              padding: "12px 24px",
              fontWeight: "600",
              boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
            }}
          >
            <Plus size={20} />
            Nuevo Almacén
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "15px" }}>
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-md-4">
              <InputGroup>
                <InputGroup.Text className="bg-light border-0">
                  <Search size={18} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar por sucursal..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="border-0 bg-light"
                  style={{ borderRadius: "0 10px 10px 0" }}
                />
              </InputGroup>
            </div>

            {/* Filtro de sucursal solo para NO administradores (gerentes, etc.) */}
            {!isAdmin && (
              <div className="col-md-4">
                <Form.Select
                  value={branchFilter}
                  onChange={handleBranchFilterChange}
                  className="border-0 bg-light"
                  style={{ borderRadius: "10px" }}
                >
                  <option value="">Todas las sucursales</option>
                  {userBranches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.branchName} {branch.branchCode ? `(${branch.branchCode})` : ""}
                    </option>
                  ))}
                </Form.Select>
              </div>
            )}

            <div className={!isAdmin ? "col-md-4" : "col-md-8"}>
              <Form.Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="border-0 bg-light"
                style={{ borderRadius: "10px" }}
              >
                <option value="">Todos los estados</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </Form.Select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-3">Cargando almacenes...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead style={{ background: "#f8f9fa" }}>
                  <tr>
                    <th className="px-4 py-3 fw-semibold text-muted">#</th>
                    <th className="px-4 py-3 fw-semibold text-muted">SUCURSAL</th>
                    <th className="px-4 py-3 fw-semibold text-muted">GERENTE</th>
                    <th className="px-4 py-3 fw-semibold text-muted">PRODUCTOS</th>
                    <th className="px-4 py-3 fw-semibold text-muted">CANTIDAD TOTAL</th>
                    <th className="px-4 py-3 fw-semibold text-muted">ÚLTIMO INGRESO</th>
                    <th className="px-4 py-3 fw-semibold text-muted">ESTADO</th>
                    <th className="px-4 py-3 fw-semibold text-muted text-center">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {storages.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-5 text-muted">
                        <Warehouse size={48} className="mb-3 opacity-50" />
                        <p className="mb-0">No se encontraron almacenes</p>
                      </td>
                    </tr>
                  ) : (
                    storages.map((storage, index) => (
                      <tr key={storage._id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                        <td className="px-4 py-3">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="fw-semibold">{getBranchName(storage)}</div>
                            {getBranchCode(storage) && (
                              <small className="text-muted">{getBranchCode(storage)}</small>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">{getManagerName(storage)}</td>
                        <td className="px-4 py-3">
                          <Badge bg="info" pill>
                            {getProductsCount(storage)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge bg="primary" pill>
                            {getTotalQuantity(storage)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <small>{formatDate(storage.lastIncome)}</small>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            bg={storage.isActive ? "success" : "danger"}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "20px",
                              fontWeight: "500",
                            }}
                          >
                            {storage.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <StorageActions
                            storage={storage}
                            onStorageUpdated={handleStorageUpdated}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && storages.length > 0 && (
            <div className="d-flex justify-content-between align-items-center px-4 py-3 border-top">
              <p className="text-muted mb-0">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
                {pagination.total} almacenes
              </p>
              <div className="d-flex gap-2">
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  style={{ borderRadius: "8px" }}
                >
                  <ChevronLeft size={16} />
                </Button>
                <span className="px-3 py-1">
                  Página {pagination.page} de {pagination.pages}
                </span>
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  style={{ borderRadius: "8px" }}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {isAdmin && (
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
