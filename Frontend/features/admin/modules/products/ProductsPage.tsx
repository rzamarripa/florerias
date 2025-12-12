"use client";

import React, { useEffect, useState } from "react";
import { Button, Table, Badge, Form, Spinner } from "react-bootstrap";
import { Plus, Package, Search, ChevronLeft, ChevronRight, Eye, Edit, ToggleLeft, ToggleRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { productsService } from "./services/products";
import { Product, ProductFilters } from "./types";

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

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setStatusFilter(e.target.value);
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
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold">Productos</h2>
          <p className="text-muted mb-0">Gestiona el catálogo de productos</p>
        </div>
        <Button
          variant="primary"
          onClick={handleNewProduct}
          className="d-flex align-items-center gap-2 px-4"
        >
          <Plus size={20} />
          Nuevo Producto
        </Button>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "15px" }}>
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="position-relative">
                <Search
                  size={18}
                  className="position-absolute top-50 translate-middle-y ms-3 text-muted"
                  style={{ zIndex: 10 }}
                />
                <Form.Control
                  type="text"
                  placeholder="Buscar producto..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="ps-5 border-0 bg-light"
                  style={{ borderRadius: "10px" }}
                />
              </div>
            </div>
            <div className="col-md-6">
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

      {/* Tabla de productos */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="text-muted mt-3">Cargando productos...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead style={{ background: "#f8f9fa" }}>
                  <tr>
                    <th className="px-4 py-3 fw-semibold text-muted">ORDEN</th>
                    <th className="px-4 py-3 fw-semibold text-muted">NOMBRE</th>
                    <th className="px-4 py-3 fw-semibold text-muted">DESCRIPCIÓN</th>
                    <th className="px-4 py-3 fw-semibold text-muted">COSTO</th>
                    <th className="px-4 py-3 fw-semibold text-muted">PRECIO</th>
                    <th className="px-4 py-3 fw-semibold text-muted">ESTATUS</th>
                    <th className="px-4 py-3 fw-semibold text-muted text-center">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-5 text-muted">
                        <Package size={48} className="mb-3 opacity-50" />
                        <div>No se encontraron productos</div>
                        <small>Intenta ajustar los filtros de búsqueda</small>
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product._id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                        <td className="px-4 py-3">{product.orden}</td>
                        <td className="px-4 py-3">
                          <div className="d-flex align-items-center gap-3">
                            {product.imagen ? (
                              <img
                                src={product.imagen}
                                alt={product.nombre}
                                className="rounded border"
                                width="40"
                                height="40"
                                style={{ objectFit: "cover", minWidth: "40px" }}
                              />
                            ) : (
                              <div className="bg-light rounded border d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px", minWidth: "40px" }}>
                                <Package size={20} className="text-muted" />
                              </div>
                            )}
                            <div>
                              <div className="fw-semibold">{product.nombre}</div>
                              <div className="text-muted small">{product.unidad}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className="text-truncate"
                            style={{ maxWidth: "300px" }}
                            title={product.descripcion}
                          >
                            {product.descripcion || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-success fw-medium">
                          ${(product.totalCosto || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-primary fw-medium">
                          ${(product.totalVenta || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            bg={product.estatus ? "success" : "danger"}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "20px",
                              fontWeight: "500",
                            }}
                          >
                            {product.estatus ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="d-flex justify-content-center gap-2">
                            <Button
                              variant="light"
                              size="sm"
                              onClick={() => handleViewProduct(product._id)}
                              className="border-0"
                              style={{ borderRadius: "8px" }}
                              title="Ver"
                            >
                              <Eye size={16} className="text-info" />
                            </Button>
                            <Button
                              variant="light"
                              size="sm"
                              onClick={() => handleEditProduct(product._id)}
                              className="border-0"
                              style={{ borderRadius: "8px" }}
                              title="Editar"
                            >
                              <Edit size={16} className="text-warning" />
                            </Button>
                            <Button
                              variant="light"
                              size="sm"
                              onClick={() => handleToggleStatus(product)}
                              className="border-0"
                              style={{ borderRadius: "8px" }}
                              title={product.estatus ? "Desactivar" : "Activar"}
                            >
                              {product.estatus ? (
                                <ToggleRight size={16} className="text-danger" />
                              ) : (
                                <ToggleLeft size={16} className="text-success" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          )}

          {/* Paginación */}
          {!loading && products.length > 0 && (
            <div className="d-flex justify-content-between align-items-center px-4 py-3 border-top">
              <p className="text-muted mb-0">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} productos
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
    </div>
  );
};

export default ProductsPage;
