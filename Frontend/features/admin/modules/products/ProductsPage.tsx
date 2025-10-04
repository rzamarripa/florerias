"use client";

import React, { useEffect, useState } from "react";
import { Button, Table, Badge, Form } from "react-bootstrap";
import { Plus, Package, Search, ChevronLeft, ChevronRight } from "lucide-react";
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

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    const halfMax = Math.floor(maxPagesToShow / 2);

    let startPage = Math.max(1, pagination.page - halfMax);
    let endPage = Math.min(pagination.pages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="products-page">
      {/* Header con búsqueda y botón nuevo */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex gap-3 flex-grow-1">
          <div className="position-relative" style={{ width: "300px" }}>
            <Search
              size={18}
              className="position-absolute top-50 translate-middle-y ms-3 text-muted"
            />
            <Form.Control
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="ps-5"
            />
          </div>
          <Form.Select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            style={{ width: "200px" }}
          >
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </Form.Select>
        </div>
        <Button
          variant="primary"
          onClick={handleNewProduct}
          className="d-flex align-items-center gap-2"
        >
          <Plus size={18} />
          Nuevo
        </Button>
      </div>

      {/* Tabla de productos */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <Table className="table table-custom table-centered table-hover mb-0">
            <thead className="bg-light align-middle bg-opacity-25" style={{ fontSize: 16 }}>
              <tr>
                <th>Orden</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Costo</th>
                <th>Precio</th>
                <th>Estatus</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">
                    <div className="d-flex flex-column align-items-center">
                      <div className="spinner-border text-primary mb-2" role="status">
                        <span className="visually-hidden">Cargando...</span>
                      </div>
                      <p className="text-muted mb-0 small">Cargando productos...</p>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">
                    <div className="text-muted">
                      <Package size={48} className="mb-3 opacity-50" />
                      <div>No se encontraron productos</div>
                      <small>Intenta ajustar los filtros de búsqueda</small>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product, index) => (
                  <tr key={product._id}>
                    <td>{product.orden}</td>
                    <td>
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
                          <div className="fw-medium">{product.nombre}</div>
                          <div className="text-muted small">{product.unidad}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div
                        className="text-truncate"
                        style={{ maxWidth: "300px" }}
                        title={product.descripcion}
                      >
                        {product.descripcion || "-"}
                      </div>
                    </td>
                    <td className="text-success fw-medium">
                      ${(product.insumos?.reduce((sum, insumo) => sum + (insumo.importeCosto || 0), 0) || 0).toFixed(2)}
                    </td>
                    <td className="text-primary fw-medium">
                      ${(product.insumos?.reduce((sum, insumo) => sum + (insumo.importeVenta || 0), 0) || 0).toFixed(2)}
                    </td>
                    <td>
                      <Badge
                        bg={product.estatus ? "success" : "danger"}
                        className="bg-opacity-10"
                        style={{
                          color: product.estatus ? "#198754" : "#dc3545",
                        }}
                      >
                        {product.estatus ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="text-center">
                      <div className="d-flex gap-2 justify-content-center">
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => handleViewProduct(product._id)}
                        >
                          Ver
                        </Button>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleEditProduct(product._id)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant={product.estatus ? "outline-danger" : "outline-success"}
                          size="sm"
                          onClick={() => handleToggleStatus(product)}
                        >
                          {product.estatus ? "Desactivar" : "Activar"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

        {/* Paginación */}
        <div className="d-flex justify-content-between align-items-center p-3 border-top">
          <span className="text-muted">
            Mostrando {products.length} de {pagination.total} registros
          </span>
          <div className="d-flex gap-1 align-items-center">
            <Button
              variant="outline-secondary"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => handlePageChange(pagination.page - 1)}
              className="d-flex align-items-center"
            >
              <ChevronLeft size={16} />
              Anterior
            </Button>

            {getPageNumbers().map((pageNum, index) => (
              <Button
                key={index}
                variant={pagination.page === pageNum ? "primary" : "outline-secondary"}
                size="sm"
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </Button>
            ))}

            <Button
              variant="outline-secondary"
              size="sm"
              disabled={pagination.page === pagination.pages}
              onClick={() => handlePageChange(pagination.page + 1)}
              className="d-flex align-items-center"
            >
              Siguiente
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
