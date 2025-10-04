"use client";

import { Search, ChevronLeft, ChevronRight, Plus, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button, Form, Table } from "react-bootstrap";
import { toast } from "react-toastify";
import { clientsService } from "./services/clients";
import { Client, ClientFilters, FilterType, FilterOption, CreateClientData, UpdateClientData } from "./types";
import { useRouter } from "next/navigation";
import ClientModal from "./components/ClientModal";

const filterOptions: FilterOption[] = [
  { value: "name", label: "Nombre" },
  { value: "lastName", label: "Apellidos" },
  { value: "clientNumber", label: "Número de Cliente" },
  { value: "phoneNumber", label: "Teléfono" },
];

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterType, setFilterType] = useState<FilterType>("name");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });
  const router = useRouter();

  const loadClients = async (
    isInitial: boolean,
    page: number = pagination.page
  ) => {
    try {
      if (isInitial) {
        setLoading(true);
      }

      const filters: ClientFilters = {
        page,
        limit: pagination.limit,
      };

      if (searchTerm) {
        filters[filterType] = searchTerm;
      }

      if (statusFilter) {
        filters.status = statusFilter === "true";
      }

      const response = await clientsService.getAllClients(filters);

      if (response.data) {
        setClients(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar los clientes");
      console.error("Error loading clients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients(true, 1);
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
    loadClients(true, page);
  };

  const handleViewClient = (client: Client) => {
    router.push(`/panel/clientes/${client._id}`);
  };

  const handleCreateClient = () => {
    setSelectedClient(null);
    setShowModal(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setShowModal(true);
  };

  const handleSaveClient = async (data: CreateClientData | UpdateClientData) => {
    try {
      setModalLoading(true);
      if (selectedClient) {
        await clientsService.updateClient(selectedClient._id, data);
        toast.success("Cliente actualizado exitosamente");
      } else {
        await clientsService.createClient(data as CreateClientData);
        toast.success("Cliente creado exitosamente");
      }
      setShowModal(false);
      loadClients(false);
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el cliente");
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

  return (
    <div className="row">
      <div className="col-12">
        <div className="card">
          <div className="card-header border-light d-flex justify-content-between align-items-center py-3">
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <h5 className="mb-0 fw-bold" style={{ fontSize: 20 }}>
                Clientes
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
              onClick={handleCreateClient}
              className="d-flex align-items-center gap-2"
            >
              <Plus size={16} />
              Nuevo Cliente
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
                  <th>Cliente</th>
                  <th>Número de Cliente</th>
                  <th>Teléfono</th>
                  <th>Correo</th>
                  <th>Puntos</th>
                  <th>Estado</th>
                  <th>Fecha de Registro</th>
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
                          Cargando clientes...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : clients.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">
                      <div className="text-muted">
                        <Users size={48} className="mb-3 opacity-50" />
                        <div>No se encontraron clientes</div>
                        <small>Intenta ajustar los filtros de búsqueda</small>
                      </div>
                    </td>
                  </tr>
                ) : (
                  clients.map((client, index) => (
                    <tr key={client._id}>
                      <td>
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              fontSize: "14px",
                            }}
                          >
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-medium">{client.fullName}</div>
                            <div className="text-muted small">
                              {client.name} {client.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-secondary bg-opacity-10 text-secondary">
                          {client.clientNumber}
                        </span>
                      </td>
                      <td>{client.phoneNumber}</td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: "200px" }}>
                          {client.email || <span className="text-muted">-</span>}
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-info bg-opacity-10 text-info">
                          {client.points} pts
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge fs-6 ${
                            client.status
                              ? "bg-success bg-opacity-10 text-success"
                              : "bg-danger bg-opacity-10 text-danger"
                          }`}
                        >
                          {client.status ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>{formatDate(client.createdAt)}</td>
                      <td className="text-center">
                        <div className="d-flex gap-1 justify-content-center">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleViewClient(client)}
                            className="d-flex align-items-center gap-1"
                          >
                            Ver
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleEditClient(client)}
                            className="d-flex align-items-center gap-1"
                          >
                            Editar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
          <div className="d-flex justify-content-between align-items-center p-3 border-top">
            <span className="text-muted">
              Mostrando {clients.length} de {pagination.total} registros
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

      <ClientModal
        show={showModal}
        onHide={() => setShowModal(false)}
        client={selectedClient}
        onSave={handleSaveClient}
        loading={modalLoading}
      />
    </div>
  );
};

export default ClientsPage;
