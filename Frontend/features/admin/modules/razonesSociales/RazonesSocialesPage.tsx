"use client";

import React, { useEffect, useState } from "react";
import { Table, Form, Button } from "react-bootstrap";
import { razonesSocialesService, RazonSocial } from "./services/razonesSociales";
import RazonSocialModal from "./components/RazonSocialModal";
import { Actions } from "./components/Actions";
import { Search } from "lucide-react";

const RazonesSocialesPage: React.FC = () => {
  const [razones, setRazones] = useState<RazonSocial[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);

  const fetchRazones = async (page: number = pagination.page) => {
    try {
      const response = await razonesSocialesService.getAll({
        page,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { estatus: statusFilter }),
      });

      if (response.data) {
        setRazones(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err) {
      console.error("Error fetching razones sociales:", err);
    }
  };

  const handleEdit = async (data: RazonSocial) => {
    await razonesSocialesService.update(data._id, {
      nombreComercial: data.nombreComercial,
      razonSocial: data.razonSocial,
      direccion: data.direccion,
      estatus: data.estatus,
    });
    fetchRazones();
  };

  const handleCreate = async (data: { nombreComercial: string; razonSocial: string; direccion: string; estatus: boolean }) => {
    await razonesSocialesService.create({ ...data, estatus: data.estatus ?? true });
    fetchRazones();
  };

  const handleToggleStatus = async (razon: RazonSocial) => {
    await razonesSocialesService.update(razon._id, {
      nombreComercial: razon.nombreComercial,
      razonSocial: razon.razonSocial,
      direccion: razon.direccion,
      estatus: razon.estatus,
    });
    fetchRazones();
  };

  useEffect(() => {
    fetchRazones(1);
  }, [searchTerm, statusFilter]);

  const handlePageChange = (page: number) => {
    fetchRazones(page);
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
                  placeholder="Buscar razones sociales..."
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
            <RazonSocialModal
              show={showCreate}
              onClose={() => setShowCreate(false)}
              onSave={async (data) => {
                await handleCreate(data);
                setShowCreate(false);
              }}
            />
          </div>
          <div className="table-responsive shadow-sm">
            <Table className="table table-custom table-centered table-hover w-100 mb-0">
              <thead className="bg-light align-middle bg-opacity-25 thead-sm">
                <tr>
                  <th>#</th>
                  <th>Nombre comercial</th>
                  <th>Razón social</th>
                  <th>Dirección</th>
                  <th>Estatus</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4">
                      <div className="d-flex flex-column align-items-center">
                        <div className="spinner-border text-primary mb-2" role="status">
                          <span className="visually-hidden">Cargando...</span>
                        </div>
                        <p className="text-muted mb-0 small">Cargando razones sociales...</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  razones.map((razon, idx) => (
                    <tr key={razon._id}>
                      <td>{idx + 1}</td>
                      <td>{razon.nombreComercial}</td>
                      <td>{razon.razonSocial}</td>
                      <td>{razon.direccion}</td>
                      <td>
                        <span
                          className={`badge fs-6 ${
                            razon.estatus
                              ? "bg-success bg-opacity-10 text-success"
                              : "bg-danger bg-opacity-10 text-danger"
                          }`}
                        >
                          {razon.estatus ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>
                        
                        <Actions
                          razon={razon}
                          onToggleStatus={handleToggleStatus}
                          onRazonUpdated={fetchRazones}
                          onEdit={handleEdit}
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
              Mostrando {razones.length} de {pagination.total} registros
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

export default RazonesSocialesPage; 