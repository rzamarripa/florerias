"use client";

import React, { useState, useEffect } from "react";
import { Table, Button, Spinner, Badge, Form, InputGroup } from "react-bootstrap";
import { Pencil, Trash2, Search } from "lucide-react";
import { neighborhoodsService } from "../services/neighborhoods";
import { Neighborhood } from "../types";
import { toast } from "react-toastify";

interface NeighborhoodsTableProps {
  onEdit: (neighborhood: Neighborhood) => void;
  refreshTrigger?: number;
}

const NeighborhoodsTable: React.FC<NeighborhoodsTableProps> = ({
  onEdit,
  refreshTrigger = 0,
}) => {
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "">("");

  const fetchNeighborhoods = async () => {
    try {
      setLoading(true);
      const response = await neighborhoodsService.getAllNeighborhoods({
        page: currentPage,
        limit: 10,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      });

      if (response.success) {
        setNeighborhoods(response.data);
        setTotalPages(response.pagination.pages);
        setTotal(response.pagination.total);
      }
    } catch (error) {
      console.error("Error al cargar colonias:", error);
      toast.error("Error al cargar las colonias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNeighborhoods();
  }, [currentPage, refreshTrigger]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1);
      fetchNeighborhoods();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, statusFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar la colonia "${name}"?`)) {
      return;
    }

    try {
      const response = await neighborhoodsService.deleteNeighborhood(id);
      if (response.success) {
        toast.success("Colonia eliminada exitosamente");
        fetchNeighborhoods();
      }
    } catch (error) {
      console.error("Error al eliminar colonia:", error);
      toast.error("Error al eliminar la colonia");
    }
  };

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge bg="success" className="px-2 py-1">
        Activo
      </Badge>
    ) : (
      <Badge bg="secondary" className="px-2 py-1">
        Inactivo
      </Badge>
    );
  };

  if (loading && neighborhoods.length === 0) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Cargando colonias...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filtros */}
      <div className="row mb-2 g-2">
        <div className="col-md-8">
          <InputGroup>
            <InputGroup.Text
              style={{
                backgroundColor: "white",
                border: "2px solid #e9ecef",
                borderRight: "none",
              }}
            >
              <Search size={18} />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Buscar por nombre de colonia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: "2px solid #e9ecef",
                borderLeft: "none",
                borderRadius: "0 8px 8px 0",
              }}
            />
          </InputGroup>
        </div>
        <div className="col-md-4">
          <Form.Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "active" | "inactive" | "")}
            style={{
              border: "2px solid #e9ecef",
              borderRadius: "8px",
            }}
          >
            <option value="">Todos los estatus</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </Form.Select>
        </div>
      </div>

      {/* Tabla */}
      <div
        className="table-responsive"
        style={{
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <Table hover className="mb-0">
          <thead style={{ backgroundColor: "#f8f9fa" }}>
            <tr>
              <th className="py-2 px-2 fw-semibold text-muted">No.</th>
              <th className="py-2 px-2 fw-semibold text-muted">Colonia</th>
              <th className="py-2 px-2 fw-semibold text-muted text-end">
                Precio Entrega
              </th>
              <th className="py-2 px-2 fw-semibold text-muted text-center">
                Estatus
              </th>
              <th className="py-2 px-2 fw-semibold text-muted text-center">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {neighborhoods.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-muted">
                  {searchTerm || statusFilter
                    ? "No se encontraron colonias con los filtros aplicados"
                    : "No hay colonias registradas"}
                </td>
              </tr>
            ) : (
              neighborhoods.map((neighborhood, index) => (
                <tr key={neighborhood._id}>
                  <td className="py-2 px-2">
                    {(currentPage - 1) * 10 + index + 1}
                  </td>
                  <td className="py-2 px-2 fw-semibold">{neighborhood.name}</td>
                  <td className="py-2 px-2 text-end fw-semibold">
                    ${neighborhood.priceDelivery.toFixed(2)}
                  </td>
                  <td className="py-2 px-2 text-center">
                    {getStatusBadge(neighborhood.status)}
                  </td>
                  <td className="py-2 px-2">
                    <div className="d-flex gap-2 justify-content-center">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => onEdit(neighborhood)}
                        className="d-flex align-items-center gap-1"
                        style={{
                          borderRadius: "6px",
                          padding: "4px 8px",
                        }}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(neighborhood._id, neighborhood.name)}
                        className="d-flex align-items-center gap-1"
                        style={{
                          borderRadius: "6px",
                          padding: "4px 8px",
                        }}
                      >
                        <Trash2 size={14} />
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
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-2">
          <span className="text-muted">
            Mostrando {neighborhoods.length} de {total} colonias
          </span>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              disabled={currentPage === 1 || loading}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Anterior
            </Button>
            <span className="d-flex align-items-center px-3">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline-primary"
              size="sm"
              disabled={currentPage === totalPages || loading}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NeighborhoodsTable;
