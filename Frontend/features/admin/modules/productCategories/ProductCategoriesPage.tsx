"use client";

import React, { useEffect, useState } from "react";
import { Button, Table, Badge, Form, InputGroup, Spinner } from "react-bootstrap";
import { Plus, Search, ChevronLeft, ChevronRight, PackageSearch } from "lucide-react";
import { toast } from "react-toastify";
import { productCategoriesService } from "./services/productCategories";
import { ProductCategory } from "./types";
import ProductCategoryActions from "./components/ProductCategoryActions";
import ProductCategoryModal from "./components/ProductCategoryModal";

const ProductCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const loadCategories = async (isInitial: boolean, page: number = pagination.page) => {
    try {
      if (isInitial) {
        setLoading(true);
      }

      const filters: any = {
        page,
        limit: pagination.limit,
      };

      if (searchTerm) {
        filters.search = searchTerm;
      }

      const response = await productCategoriesService.getAllProductCategories(filters);

      if (response.data) {
        setCategories(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar las categorías");
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories(true, 1);
  }, [searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (page: number) => {
    loadCategories(true, page);
  };

  const handleNewCategory = () => {
    setSelectedCategory(null);
    setShowModal(true);
  };

  const handleEditCategory = (category: ProductCategory) => {
    setSelectedCategory(category);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCategory(null);
  };

  const handleCategoryUpdated = () => {
    loadCategories(false);
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold">Categorías de Productos</h2>
          <p className="text-muted mb-0">Gestiona las categorías de productos del sistema</p>
        </div>
        <Button
          variant="primary"
          onClick={handleNewCategory}
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
          Nueva Categoría
        </Button>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "15px" }}>
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-md-12">
              <InputGroup>
                <InputGroup.Text className="bg-light border-0">
                  <Search size={18} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar por nombre o descripción..."
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
      <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-3">Cargando categorías...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead style={{ background: "#f8f9fa" }}>
                  <tr>
                    <th className="px-4 py-3 fw-semibold text-muted">#</th>
                    <th className="px-4 py-3 fw-semibold text-muted">NOMBRE</th>
                    <th className="px-4 py-3 fw-semibold text-muted">DESCRIPCIÓN</th>
                    <th className="px-4 py-3 fw-semibold text-muted">ESTADO</th>
                    <th className="px-4 py-3 fw-semibold text-muted text-center">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-5 text-muted">
                        <PackageSearch size={48} className="mb-3 opacity-50" />
                        <p className="mb-0">No se encontraron categorías de productos</p>
                      </td>
                    </tr>
                  ) : (
                    categories.map((category, index) => (
                      <tr key={category._id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                        <td className="px-4 py-3">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </td>
                        <td className="px-4 py-3 fw-semibold">{category.name}</td>
                        <td className="px-4 py-3">
                          {category.description || (
                            <span className="text-muted fst-italic">Sin descripción</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            bg={category.isActive ? "success" : "danger"}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "20px",
                              fontWeight: "500",
                            }}
                          >
                            {category.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <ProductCategoryActions
                            category={category}
                            onEdit={handleEditCategory}
                            onCategoryUpdated={handleCategoryUpdated}
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
          {!loading && categories.length > 0 && (
            <div className="d-flex justify-content-between align-items-center px-4 py-3 border-top">
              <p className="text-muted mb-0">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} categorías
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

      {/* Category Modal */}
      <ProductCategoryModal
        show={showModal}
        onHide={handleCloseModal}
        onSuccess={handleCategoryUpdated}
        category={selectedCategory}
      />
    </div>
  );
};

export default ProductCategoriesPage;
