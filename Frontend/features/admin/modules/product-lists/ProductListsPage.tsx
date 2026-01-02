"use client";

import React, { useEffect, useState } from "react";
import {
  Button,
  Table,
  Badge,
  Form,
  InputGroup,
  Spinner,
} from "react-bootstrap";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { productListsService } from "./services/productLists";
import { ProductList, ProductListFilters } from "./types";
import ProductListActions from "./components/ProductListActions";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useUserRoleStore } from "@/stores/userRoleStore";

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

  // Función para formatear números con separación de miles
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

      // Si es admin y tiene sucursal activa, filtrar por esa sucursal
      if (isAdmin && activeBranch) {
        filters.branchId = activeBranch._id;
        console.log("🔍 [ProductLists] Filtrando por sucursal:", activeBranch.branchName, activeBranch._id);
      } else {
        console.log("🔍 [ProductLists] Sin filtro de sucursal - isAdmin:", isAdmin, "activeBranch:", activeBranch);
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

  useEffect(() => {
    loadProductLists(true, 1);
  }, [searchTerm, activeBranch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (page: number) => {
    loadProductLists(true, page);
  };

  const handleNewProductList = () => {
    router.push("/catalogos/listas-productos/nuevo");
  };

  // Cálculos para cada lista
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
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h2 className="mb-1 fw-bold">Listas de Productos</h2>
          <p className="text-muted mb-0">Gestiona las listas de productos</p>
        </div>
        <Button
          variant="primary"
          onClick={handleNewProductList}
          className="d-flex align-items-center gap-2 px-4"
        >
          <Plus size={20} />
          Nueva Lista
        </Button>
      </div>

      {/* Filters */}
      <div
        className="card border-0 shadow-sm mb-2"
        style={{ borderRadius: "10px" }}
      >
        <div className="card-body p-2">
          <div className="row g-2">
            <div className="col-md-6">
              <InputGroup>
                <InputGroup.Text className="bg-light border-0">
                  <Search size={18} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar por nombre de lista..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="border-0 bg-light"
                  style={{ borderRadius: "0 10px 10px 0" }}
                />
              </InputGroup>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: "10px" }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Cargando listas...</p>
            </div>
          ) : productLists.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-0">
                No se encontraron listas de productos
              </p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0 px-2 py-2">Nombre</th>
                      <th className="border-0 px-2 py-2">Sucursal</th>
                      <th className="border-0 px-2 py-2">Fecha Creación</th>
                      <th className="border-0 px-2 py-2">Fecha Expiración</th>
                      <th className="border-0 px-2 py-2 text-end">
                        Total Gastado
                      </th>
                      <th className="border-0 px-2 py-2 text-end">
                        Ganancias Brutas
                      </th>
                      <th className="border-0 px-2 py-2 text-end">
                        Ganancias Netas
                      </th>
                      <th className="border-0 px-2 py-2 text-center">Estado</th>
                      <th className="border-0 px-2 py-2 text-center">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {productLists.map((productList) => {
                      const totals = calculateTotals(productList);
                      return (
                        <tr key={productList._id}>
                          <td className="px-2 py-2">
                            <div className="fw-semibold">
                              {productList.name}
                            </div>
                            <small className="text-muted">
                              {productList.company?.tradeName ||
                                productList.company?.legalName}
                            </small>
                          </td>
                          <td className="px-2 py-2">
                            <div className="fw-semibold">
                              {productList.branch && typeof productList.branch === 'object'
                                ? (productList.branch as any).branchName || 'Sin nombre'
                                : 'Sin sucursal'}
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            {new Date(productList.createdAt).toLocaleDateString(
                              "es-MX",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </td>
                          <td className="px-2 py-2">
                            {new Date(
                              productList.expirationDate
                            ).toLocaleDateString("es-MX", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="px-2 py-2 text-end text-danger fw-semibold">
                            ${formatNumber(totals.totalGastado)}
                          </td>
                          <td className="px-2 py-2 text-end text-primary fw-semibold">
                            ${formatNumber(totals.gananciasBrutas)}
                          </td>
                          <td className="px-2 py-2 text-end fw-bold">
                            <span
                              className={
                                totals.gananciasNetas >= 0
                                  ? "text-success"
                                  : "text-danger"
                              }
                            >
                              ${formatNumber(totals.gananciasNetas)}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <Badge
                              bg={productList.status ? "success" : "secondary"}
                            >
                              {productList.status ? "Activo" : "Inactivo"}
                            </Badge>
                          </td>
                          <td className="px-2 py-2">
                            <ProductListActions
                              productList={productList}
                              onStatusChange={() => loadProductLists(false)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="d-flex justify-content-between align-items-center px-2 py-2 border-top">
                  <div className="text-muted small">
                    Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{" "}
                    de {pagination.total} resultados
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    <div className="d-flex align-items-center px-3">
                      Página {pagination.page} de {pagination.pages}
                    </div>
                    <Button
                      variant="outline-secondary"
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
        </div>
      </div>
    </div>
  );
};

export default ProductListsPage;
