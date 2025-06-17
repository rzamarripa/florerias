/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useEffect, useState } from "react";
import { Table, Form, Button } from "react-bootstrap";
import BrandModal from "./components/BrandModal";
import { Search } from "lucide-react";
import { brandsService, Brand } from "./services/brands";
import Image from "next/image";
import { Actions } from "./components/Actions";

const BrandPage: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [showCreate, setShowCreate] = useState(false);

  const fetchBrands = async (isCreating: boolean, page: number = pagination.page) => {
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
    try {
      if (brand.isActive) {
        await brandsService.delete(brand._id);
      } else {
        await brandsService.activate(brand._id);
      }
      fetchBrands(false);
    } catch (error) {
      console.error("Error toggling brand status:", error);
    }
  };

  useEffect(() => {
    fetchBrands(true, 1);
  }, [searchTerm]);

  const handlePageChange = (page: number) => {
    fetchBrands(true, page);
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
                  style={{ left: "0.75rem", top: "50%", transform: "translateY(-50%)" }}
                />
              </div>
            </div>
            <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
              Nuevo
            </Button>
            <BrandModal
                show={showCreate}
                onClose={() => setShowCreate(false)}
                reloadData={fetchBrands}
            />
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
                        <div className="spinner-border text-primary mb-2" role="status">
                          <span className="visually-hidden">Cargando...</span>
                        </div>
                        <p className="text-muted mb-0 small">Cargando marcas...</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  brands.map((brand, idx) => (
                    <tr key={brand._id}>
                      <td>{(pagination.page - 1) * pagination.limit + idx + 1}</td>
                      <td>
                        {brand.logo ? (
                          <Image 
                            src={brand.logo} 
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
                      <td>{brand.category || "-"}</td>
                      <td>{brand.name}</td>
                      <td>{brand.razonesSociales || "-"}</td>
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
                          reloadData={fetchBrands}
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
            <div className="d-flex gap-1">
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                Anterior
              </Button>
              {Array.from(
                { length: Math.min(5, pagination.pages) },
                (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={
                        pagination.page === pageNum
                          ? "primary"
                          : "outline-secondary"
                      }
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                }
              )}
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={pagination.page === pagination.pages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandPage;