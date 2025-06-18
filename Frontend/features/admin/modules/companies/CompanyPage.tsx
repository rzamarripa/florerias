"use client";

import React, { useEffect, useState } from "react";
import { Table, Form, Button } from "react-bootstrap";
import { companiesService, Company } from "./services/companies";
import CompanyModal from "./components/CompanyModal";
import { Actions } from "./components/Actions";
import { Search } from "lucide-react";

const CompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [showCreate, setShowCreate] = useState(false);

  const fetchCompanies = async (isCreating: boolean, page: number = pagination.page) => {
    try {
      if(isCreating){
        setLoading(true)
      }
      const response = await companiesService.getAll({
        page,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm }),
      });

      if (response.data) {
        setCompanies(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err) {
      console.error("Error fetching companies:", err);
    } finally {
      setLoading(false)
    }
  };
  
  const handleToggleStatus = async (company: Company) => {
    if (company.isActive) {
      await companiesService.delete(company._id);
    } else {
      await companiesService.activate(company._id);
    }
    fetchCompanies(false);
  };

  useEffect(() => {
    fetchCompanies(true, 1);
  }, [searchTerm]);

  const handlePageChange = (page: number) => {
    fetchCompanies(true, page);
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
                  placeholder="Buscar empresas..."
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
            <CompanyModal
              show={showCreate}
              onClose={() => setShowCreate(false)}
              reloadData={fetchCompanies}
            />
          </div>
          <div className="table-responsive shadow-sm">
            <Table className="table table-custom table-centered table-hover w-100 mb-0">
              <thead className="bg-light align-middle bg-opacity-25 thead-sm">
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Representante Legal</th> 
                  <th>RFC</th>
                  <th>Dirección</th>
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
                        <p className="text-muted mb-0 small">Cargando empresas...</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  companies.map((company, idx) => (
                    <tr key={company._id}>
                      <td>{idx + 1}</td>
                      <td>{company.name}</td>
                      <td>{company.legalRepresentative}</td>
                      <td>{company.rfc}</td> 
                      <td>{company.address}</td>
                      <td>
                        <span
                          className={`badge fs-6 ${company.isActive
                            ? "bg-success bg-opacity-10 text-success"
                            : "bg-danger bg-opacity-10 text-danger"
                            }`}
                        >
                          {company.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>
                        <Actions
                          company={company}
                          onToggleStatus={handleToggleStatus}
                          reloadData={fetchCompanies}
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
              Mostrando {companies.length} de {pagination.total} registros
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

export default CompaniesPage