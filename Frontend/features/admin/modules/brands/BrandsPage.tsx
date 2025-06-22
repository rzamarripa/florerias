"use client";

import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Button, Form, Table } from "react-bootstrap";
import { Actions } from "./components/Actions";
import BrandModal from "./components/BrandModal";
import { brandsService } from "./services/brands";
import { Brand } from "./types";

const BrandPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const fetchBrands = async (
    isCreating: boolean,
    page: number = pagination.page
  ) => {
    try {
      if (isCreating) {
        setLoading(true);
      }
      const response = await brandsService.getAll({
        page,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm }),
      });

      if (response.data) {
        setBrands(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err) {
      console.error("Error fetching brands:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (brand: Brand) => {
    if (brand.isActive) {
      await brandsService.delete(brand._id);
    } else {
      await brandsService.activate(brand._id);
    }
    fetchBrands(false);
  };

  useEffect(() => {
    fetchBrands(true, 1);
  }, [searchTerm]);

  const handlePageChange = (page: number) => {
    fetchBrands(true, page);
  };

  const handleBrandSaved = () => {
    fetchBrands(false);
  };

  // Función para generar los números de página a mostrar
  const getPageNumbers = () => {
    const { page, pages } = pagination;
    const delta = 2; // Número de páginas a mostrar antes y después de la página actual
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, page - delta); i <= Math.min(pages - 1, page + delta); i++) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < pages - 1) {
      rangeWithDots.push('...', pages);
    } else if (pages > 1) {
      rangeWithDots.push(pages);
    }

    return rangeWithDots;
  };

  return (
    <div className="row">
      <div className="col-12">
        <div className="card">
          <div className="card-header border-light d-flex justify-content-between align-items-center py-3">
            <div className="d-flex gap-2">
              <div className="position-relative" style={{ maxWidth: 400 }}>
                <Form.Control
                  type="search"
                  placeholder="Buscar marcas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="shadow-none px-4"
                  style={{ fontSize: 15, paddingLeft: "2.5rem" }}
                />
                <Search
                  className="text-muted position-absolute"
                  size={18}
                  style={{
                    left: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                />
              </div>
            </div>
            <BrandModal onBrandSaved={handleBrandSaved} />
          </div>
          <div className="table-responsive shadow-sm">
            <Table className="table table-custom table-centered table-hover w-100 mb-0">
              <thead className="bg-light align-middle bg-opacity-25 thead-sm">
                <tr>
                  <th>#</th>
                  <th>Logo</th>
                  <th>Categoría</th>
                  <th>Nombre</th>
                  <th>Razones Sociales</th>
                  <th>Descripción</th>
                  <th>Estatus</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      <div className="d-flex flex-column align-items-center">
                        <div
                          className="spinner-border text-primary mb-2"
                          role="status"
                        >
                          <span className="visually-hidden">Cargando...</span>
                        </div>
                        <p className="text-muted mb-0 small">
                          Cargando marcas...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  brands.map((brand, index) => (
                    <tr key={brand._id}>
                      <td className="text-center">
                        <span className="text-muted">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </span>
                      </td>
                      <td>
                        {brand.logo ? (
                          <Image
                            src={`data:${brand.logo.contentType};base64,${brand.logo.data}`}
                            alt={brand.name}
                            width={40}
                            height={40}
                            className="rounded"
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            className="bg-light rounded d-flex align-items-center justify-content-center"
                            style={{ width: "40px", height: "40px" }}
                          >
                            <span className="text-muted small">Sin logo</span>
                          </div>
                        )}
                      </td>
                      <td>
                        {brand.categoryId &&
                          typeof brand.categoryId === "object"
                          ? brand.categoryId.name
                          : "-"}
                      </td>
                      <td>{brand.name}</td>
                      <td>{brand.companies?.length + " Razones sociales"}</td>
                      <td>
                        <span
                          className="text-truncate d-inline-block"
                          style={{ maxWidth: "200px" }}
                          title={brand.description}
                        >
                          {brand.description || "-"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge fs-6 ${brand.isActive
                            ? "bg-success bg-opacity-10 text-success"
                            : "bg-danger bg-opacity-10 text-danger"
                            }`}
                        >
                          {brand.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>
                        <Actions
                          brand={brand}
                          onToggleStatus={handleToggleStatus}
                          onBrandSaved={handleBrandSaved}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
          <div className="d-flex justify-content-between align-items-center p-3 border-top">
            <span className="text-muted">
              Mostrando {brands.length} de {pagination.total} registros
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
                <React.Fragment key={index}>
                  {pageNum === '...' ? (
                    <span className="px-2 text-muted">...</span>
                  ) : (
                    <Button
                      variant={
                        pageNum === pagination.page
                          ? "primary"
                          : "outline-secondary"
                      }
                      size="sm"
                      onClick={() => handlePageChange(pageNum as number)}
                    >
                      {pageNum}
                    </Button>
                  )}
                </React.Fragment>
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
    </div>
  );
};

export default BrandPage;
