"use client";

import { Search, ChevronLeft, ChevronRight, Plus, User } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button, Form, Table, Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import { productionService } from "./services/production";
import { Production, ProductionFilters, FilterType, FilterOption, CreateProductionData, UpdateProductionData } from "./types";
import Actions from "./components/Actions";
import ProductionModal from "./components/ProductionModal";

const filterOptions: FilterOption[] = [
  { value: "nombre", label: "Nombre" },
  { value: "apellidoPaterno", label: "Apellido Paterno" },
  { value: "usuario", label: "Usuario" },
  { value: "correo", label: "Correo" },
  { value: "telefono", label: "Teléfono" },
];

const ProductionPage: React.FC = () => {
  const [production, setProduction] = useState<Production[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterType, setFilterType] = useState<FilterType>("nombre");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const loadProduction = async (
    isInitial: boolean,
    page: number = pagination.page
  ) => {
    try {
      if (isInitial) {
        setLoading(true);
      }

      const filters: ProductionFilters = {
        page,
        limit: pagination.limit,
      };

      if (searchTerm) {
        filters[filterType] = searchTerm;
      }

      if (statusFilter) {
        filters.estatus = statusFilter === "true";
      }

      const response = await productionService.getAllProduction(filters);

      if (response.data) {
        setProduction(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar el personal de producción");
      console.error("Error loading production:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduction(true, 1);
  }, [searchTerm, filterType, statusFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleFilterTypeChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    setFilterType(e.target.value as FilterType);
    setSearchTerm("");
  };

  const handleStatusFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    setStatusFilter(e.target.value);
  };

  const handlePageChange = (page: number) => {
    loadProduction(true, page);
  };

  const handleCreateProduction = () => {
    setSelectedProduction(null);
    setShowModal(true);
  };

  const handleEditProduction = (production: Production) => {
    setSelectedProduction(production);
    setShowModal(true);
  };

  const handleToggleStatus = async (production: Production) => {
    try {
      if (production.estatus) {
        await productionService.deactivateProduction(production._id);
        toast.success("Personal de producción desactivado exitosamente");
      } else {
        await productionService.activateProduction(production._id);
        toast.success("Personal de producción activado exitosamente");
      }
      loadProduction(false);
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar el estado del personal de producción");
    }
  };

  const handleSaveProduction = async (data: CreateProductionData | UpdateProductionData) => {
    try {
      setModalLoading(true);
      if (selectedProduction) {
        await productionService.updateProduction(selectedProduction._id, data);
        toast.success("Personal de producción actualizado exitosamente");
      } else {
        await productionService.createProduction(data as CreateProductionData);
        toast.success("Personal de producción creado exitosamente");
      }
      setShowModal(false);
      loadProduction(false);
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el personal de producción");
    } finally {
      setModalLoading(false);
    }
  };

  const getPageNumbers = () => {
    const { page, pages } = pagination;
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(pages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < pages - 1) {
      rangeWithDots.push("...", pages);
    } else if (pages > 1) {
      rangeWithDots.push(pages);
    }

    return rangeWithDots;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getFullName = (production: Production) => {
    return `${production.nombre} ${production.apellidoPaterno} ${production.apellidoMaterno}`.trim();
  };

  return (
    <div className="row">
      <div className="col-12">
        <div className="card">
          <div className="card-header border-light d-flex justify-content-between align-items-center py-2">
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <h5 className="mb-0 fw-bold" style={{ fontSize: 20 }}>
                Personal de Producción
              </h5>
              <Form.Select
                value={filterType}
                onChange={handleFilterTypeChange}
                className="shadow-none"
                style={{ maxWidth: 180 }}
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
              <div className="position-relative" style={{ maxWidth: 300 }}>
                <Form.Control
                  type="search"
                  placeholder={`Buscar por ${filterOptions
                    .find((opt) => opt.value === filterType)
                    ?.label.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={handleSearchChange}
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
              <Form.Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="shadow-none"
                style={{ maxWidth: 150 }}
              >
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </Form.Select>
            </div>
            <Button
              variant="primary"
              onClick={handleCreateProduction}
              className="d-flex align-items-center gap-2"
            >
              <Plus size={16} />
              Nuevo Personal Producción
            </Button>
          </div>
          <div className="table-responsive shadow-sm border border-2 rounded-3">
            <Table className="table table-custom table-centered table-hover table-bordered border border-2 w-100 mb-0">
              <thead
                className="bg-light align-middle bg-opacity-25"
                style={{ fontSize: 16 }}
              >
                <tr>
                  <th>#</th>
                  <th>Foto</th>
                  <th>Nombre</th>
                  <th>Usuario</th>
                  <th>Dirección</th>
                  <th>Teléfono</th>
                  <th>Correo</th>
                  <th>Estatus</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">
                      <div className="d-flex flex-column align-items-center">
                        <div
                          className="spinner-border text-primary mb-2"
                          role="status"
                        >
                          <span className="visually-hidden">Cargando...</span>
                        </div>
                        <p className="text-muted mb-0 small">
                          Cargando personal de producción...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : production.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">
                      <div className="text-muted">
                        <User size={48} className="mb-3 opacity-50" />
                        <div>No se encontró personal de producción</div>
                        <small>Intenta ajustar los filtros de búsqueda</small>
                      </div>
                    </td>
                  </tr>
                ) : (
                  production.map((person, index) => (
                    <tr key={person._id}>
                      <td>
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </td>
                      <td>
                        <div className="d-flex align-items-center justify-content-center">
                          {person.foto ? (
                            <img
                              src={person.foto}
                              alt={getFullName(person)}
                              className="rounded-circle object-fit-cover"
                              style={{ width: "40px", height: "40px" }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                target.nextElementSibling!.classList.remove("d-none");
                              }}
                            />
                          ) : null}
                          <div
                            className={`bg-primary text-white d-flex align-items-center justify-content-center fw-bold rounded-circle ${
                              person.foto ? "d-none" : ""
                            }`}
                            style={{
                              width: "40px",
                              height: "40px",
                              fontSize: "16px",
                            }}
                          >
                            {person.nombre.charAt(0).toUpperCase()}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="fw-medium">{getFullName(person)}</div>
                          <div className="text-muted small">
                            {formatDate(person.createdAt)}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-secondary bg-opacity-10 text-secondary">
                          @{person.usuario}
                        </span>
                      </td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: "200px" }}>
                          {person.direccion}
                        </div>
                      </td>
                      <td>{person.telefono}</td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: "180px" }}>
                          {person.correo}
                        </div>
                      </td>
                      <td>
                        <Badge
                          bg={person.estatus ? "success" : "danger"}
                          className="bg-opacity-10"
                          style={{
                            color: person.estatus ? "#198754" : "#dc3545",
                          }}
                        >
                          {person.estatus ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <Actions
                          production={person}
                          onEdit={handleEditProduction}
                          onToggleStatus={handleToggleStatus}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
          <div className="d-flex justify-content-between align-items-center p-2 border-top">
            <span className="text-muted">
              Mostrando {production.length} de {pagination.total} registros
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
                  {pageNum === "..." ? (
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

      <ProductionModal
        show={showModal}
        onHide={() => setShowModal(false)}
        production={selectedProduction}
        onSave={handleSaveProduction}
        loading={modalLoading}
      />
    </div>
  );
};

export default ProductionPage;