"use client";

import { Search, ChevronLeft, ChevronRight, Plus, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button, Form, Table, Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import { managersService } from "./services/managers";
import { Manager, ManagerFilters, FilterType, FilterOption, CreateManagerData, UpdateManagerData } from "./types";
import Actions from "./components/Actions";
import ManagerModal from "./components/ManagerModal";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { companyService } from "@/services/company";

const filterOptions: FilterOption[] = [
  { value: "nombre", label: "Nombre" },
  { value: "apellidoPaterno", label: "Apellido Paterno" },
  { value: "usuario", label: "Usuario" },
  { value: "correo", label: "Correo" },
  { value: "telefono", label: "Teléfono" },
];

const ManagersPage: React.FC = () => {
  const { activeBranch } = useActiveBranchStore();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterType, setFilterType] = useState<FilterType>("nombre");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyLoaded, setCompanyLoaded] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const loadManagers = async (
    isInitial: boolean,
    page: number = pagination.page
  ) => {
    try {
      if (isInitial) {
        setLoading(true);
      }

      const filters: ManagerFilters = {
        page,
        limit: pagination.limit,
      };

      if (searchTerm) {
        filters[filterType] = searchTerm;
      }

      if (statusFilter) {
        filters.estatus = statusFilter === "true";
      }

      // Agregar filtro por companyId si está disponible
      if (companyId) {
        filters.companyId = companyId;
      }

      const response = await managersService.getAllManagers(filters);

      if (response.data) {
        setManagers(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar los gerentes");
      console.error("Error loading managers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar la empresa del usuario al montar el componente
  useEffect(() => {
    const loadUserCompany = async () => {
      try {
        const response = await companyService.getUserCompany();
        if (response.success && response.data) {
          setCompanyId(response.data._id);
        }
      } catch (error: any) {
        // Si el usuario no tiene empresa asignada (ej: Super Admin), no mostrar error
        // Solo registrar en consola para debugging
        console.log("Usuario sin empresa asignada:", error.message);
      } finally {
        // Marcar como cargado independientemente del resultado
        setCompanyLoaded(true);
      }
    };

    loadUserCompany();
  }, []);

  // Cargar gerentes cuando cambian los filtros o se obtiene el companyId
  useEffect(() => {
    // Solo cargar después de que se haya intentado cargar la empresa
    if (companyLoaded) {
      loadManagers(true, 1);
    }
  }, [searchTerm, filterType, statusFilter, companyId, companyLoaded]);

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
    loadManagers(true, page);
  };

  const handleCreateManager = () => {
    setSelectedManager(null);
    setShowModal(true);
  };

  const handleEditManager = (manager: Manager) => {
    setSelectedManager(manager);
    setShowModal(true);
  };

  const handleToggleStatus = async (manager: Manager) => {
    try {
      if (manager.estatus) {
        await managersService.deactivateManager(manager._id);
        toast.success("Gerente desactivado exitosamente");
      } else {
        await managersService.activateManager(manager._id);
        toast.success("Gerente activado exitosamente");
      }
      loadManagers(false);
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar el estado del gerente");
    }
  };

  const handleSaveManager = async (data: CreateManagerData | UpdateManagerData) => {
    try {
      if (!activeBranch) {
        toast.error("No hay una sucursal activa seleccionada");
        return;
      }

      setModalLoading(true);
      if (selectedManager) {
        await managersService.updateManager(selectedManager._id, data);
        toast.success("Gerente actualizado exitosamente");
      } else {
        // Agregar el branchId a los datos antes de crear
        const createData: CreateManagerData = {
          ...(data as CreateManagerData),
          branchId: activeBranch._id,
        };
        await managersService.createManager(createData);
        toast.success("Gerente creado exitosamente");
      }
      setShowModal(false);
      loadManagers(false);
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el gerente");
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

  const getFullName = (manager: Manager) => {
    return `${manager.nombre} ${manager.apellidoPaterno} ${manager.apellidoMaterno}`.trim();
  };

  return (
    <div className="row">
      <div className="col-12">
        <div className="card">
          <div className="card-header border-light d-flex justify-content-between align-items-center py-3">
            <div className="d-flex gap-2">
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
              <div className="position-relative" style={{ maxWidth: 400 }}>
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
              onClick={handleCreateManager}
              className="d-flex align-items-center gap-2"
            >
              <Plus size={16} />
              Nuevo Gerente
            </Button>
          </div>
          <div className="table-responsive shadow-sm">
            <Table className="table table-custom table-centered table-hover w-100 mb-0">
              <thead className="bg-light align-middle bg-opacity-25 thead-sm">
                <tr>
                  <th>#</th>
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
                    <td colSpan={8} className="text-center py-4">
                      <div className="d-flex flex-column align-items-center">
                        <div
                          className="spinner-border text-primary mb-2"
                          role="status"
                        >
                          <span className="visually-hidden">Cargando...</span>
                        </div>
                        <p className="text-muted mb-0 small">
                          Cargando gerentes...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : managers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      <div className="text-muted">
                        <Users size={48} className="mb-3 opacity-50" />
                        <div>No se encontraron gerentes</div>
                        <small>Intenta ajustar los filtros de búsqueda</small>
                      </div>
                    </td>
                  </tr>
                ) : (
                  managers.map((person, index) => (
                    <tr key={person._id}>
                      <td>
                        {(pagination.page - 1) * pagination.limit + index + 1}
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
                          manager={person}
                          onEdit={handleEditManager}
                          onToggleStatus={handleToggleStatus}
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
              Mostrando {managers.length} de {pagination.total} registros
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

      <ManagerModal
        show={showModal}
        onHide={() => setShowModal(false)}
        manager={selectedManager}
        onSave={handleSaveManager}
        loading={modalLoading}
      />
    </div>
  );
};

export default ManagersPage;