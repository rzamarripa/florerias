import { FileText, Plus, Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Alert, Button, Form, Table } from "react-bootstrap";
import { BsCheck2, BsPencil } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import CreatePageModal from "./components/AddPageModal";
import EditPageModal from "./components/EditPagesModal";
import { Page, pagesService } from "./services/pages";

const PaginasTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("todos");
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  const fetchPages = async (showLoading: boolean = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      const response = await pagesService.getAllPages({
        page: 1,
        limit: 100,
        ...(searchTerm && { name: searchTerm }),
        ...(selectedType === "activos" && { status: "true" }),
        ...(selectedType === "inactivos" && { status: "false" }),
      });

      if (response.success && response.data) {
        setPages(response.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al cargar las páginas";
      setError(errorMessage);
      toast.error("Error al cargar las páginas");
      console.error("Error fetching pages:", err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchPages(true);
  }, [searchTerm, selectedType]);

  const filteredPaginas: Page[] = pages.filter((pagina: Page) => {
    const matchesSearch: boolean =
      pagina.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pagina.path.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType: boolean =
      selectedType === "todos" ||
      (selectedType === "activos" && pagina.status) ||
      (selectedType === "inactivos" && !pagina.status);
    return matchesSearch && matchesType;
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedType(e.target.value);
  };

  const handleNewPageClick = (): void => {
    setShowCreateModal(true);
  };

  const handleCloseModal = (): void => {
    setShowCreateModal(false);
  };

  const handlePageCreated = (): void => {
    fetchPages(false);
  };

  const handleEditPageClick = (pageId: string): void => {
    setSelectedPageId(pageId);
    setShowEditModal(true);
  };

  const handleCloseEditModal = (): void => {
    setShowEditModal(false);
    setSelectedPageId(null);
  };

  const handlePageUpdated = (): void => {
    fetchPages(false);
  };

  const clearError = (): void => {
    setError(null);
  };

  const handleTooglePage = async (id: string) => {
    try {
      const currentPage = pages.find((page) => page._id === id);

      if (!currentPage) {
        toast.error("Página no encontrada");
        return;
      }

      if (currentPage.status) {
        const response = await pagesService.deletePage(id);
        if (response.success) {
          toast.success(`Página "${currentPage.name}" desactivada correctamente`);
          fetchPages(false);
        } else {
          throw new Error(response.message || "Error al desactivar la página");
        }
      } else {
        const response = await pagesService.activatePage(id);
        if (response.success) {
          toast.success(`Página "${currentPage.name}" activada correctamente`);
          fetchPages(false);
        } else {
          throw new Error(response.message || "Error al activar la página");
        }
      }
    } catch (err) {
      const currentPage = pages.find((page) => page._id === id);
      const pageName = currentPage?.name || "la página";
      const action = currentPage?.status ? "desactivar" : "activar";
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";

      console.error("Error toggling page status:", err);
      toast.error(`Error al ${action} ${pageName}: ${errorMessage}`);
    }
  };

  const isPageActive = (id: string) => {
    return pages.find((page) => page._id === id)?.status;
  };

  return (
    <div className="row">
      <div className="col-12">
        {error && (
          <Alert
            variant="danger"
            dismissible
            onClose={clearError}
            className="mb-4"
          >
            <strong>Error:</strong> {error}
          </Alert>
        )}

        <div className="card">
          <div className="card-header border-light d-flex justify-content-between align-items-center py-3">
            <div className="d-flex gap-2">
              <div className="position-relative" style={{ maxWidth: 400 }}>
                <Form.Control
                  type="search"
                  placeholder="Buscar páginas..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="shadow-none px-4"
                  style={{
                    fontSize: 15,
                    paddingLeft: "2.5rem",
                  }}
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

            <div className="d-flex align-items-center gap-2">
              <Form.Select
                value={selectedType}
                onChange={handleTypeChange}
                style={{ minWidth: "150px" }}
              >
                <option value="todos">Todos los estados</option>
                <option value="activos">Páginas activas</option>
                <option value="inactivos">Páginas inactivas</option>
              </Form.Select>

              <Button
                variant="primary"
                className="d-flex align-items-center gap-2 text-nowrap px-3"
                onClick={handleNewPageClick}
              >
                <Plus size={18} />
                Nueva Página
              </Button>
            </div>
          </div>

          <div className="table-responsive shadow-sm">
            <Table className="table table-custom table-centered table-select table-hover w-100 mb-0">
              <thead className="bg-light align-middle bg-opacity-25 thead-sm">
                <tr>
                  <th className="text-center">#</th>
                  <th className="text-center">PÁGINA</th>
                  <th className="text-center">RUTA</th>
                  <th className="text-center">ESTADO</th>
                  <th className="text-center text-nowrap">FECHA CREACIÓN</th>
                  <th className="text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      <div className="d-flex flex-column align-items-center">
                        <div
                          className="spinner-border text-primary mb-2"
                          role="status"
                        >
                          <span className="visually-hidden">Cargando...</span>
                        </div>
                        <p className="text-muted mb-0 small">
                          Cargando páginas...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPaginas.map((pagina: Page, index: number) => (
                    <tr key={pagina._id}>
                      <td className="text-center">
                        <span className="text-muted fw-medium">
                          {index + 1}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="d-flex flex-column">
                          <span className="fw-medium text-dark">
                            {pagina.name}
                          </span>
                          {pagina.description && (
                            <small className="text-muted">
                              {pagina.description}
                            </small>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        <code className="bg-light text-muted px-2 py-1 rounded small">
                          {pagina.path}
                        </code>
                      </td>
                      <td className="text-center">
                        <span
                          className={`badge fs-6 ${pagina.status
                            ? "bg-success bg-opacity-10 text-success"
                            : "bg-danger bg-opacity-10 text-danger"
                            }`}
                        >
                          {pagina.status ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="text-center">
                        <span>
                          {new Date(pagina.createdAt).toLocaleDateString(
                            "es-ES",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-1">
                          <button
                            className="btn btn-light btn-icon btn-sm rounded-circle"
                            title="Editar página"
                            onClick={() => handleEditPageClick(pagina._id)}
                          >
                            <BsPencil size={16} />
                          </button>
                          <button
                            className="btn btn-light btn-icon btn-sm rounded-circle"
                            title={isPageActive(pagina._id) ? "Desactivar página" : "Activar página"}
                            onClick={() => handleTooglePage(pagina._id)}
                          >
                            {isPageActive(pagina._id) ? (
                              <FiTrash2 size={16} />
                            ) : (
                              <BsCheck2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>

            {!loading && filteredPaginas.length === 0 && (
              <div className="text-center py-5">
                <FileText size={48} className="text-muted mb-3" />
                <h5 className="text-muted">No se encontraron páginas</h5>
                <p className="text-muted">
                  {searchTerm || selectedType !== "todos"
                    ? "Intenta cambiar los filtros de búsqueda"
                    : "No hay páginas disponibles en el sistema"}
                </p>
              </div>
            )}

            <div className="d-flex justify-content-between align-items-center p-3 border-top">
              <span className="text-muted">
                Mostrando {filteredPaginas.length} registros
              </span>
            </div>
          </div>

          <CreatePageModal
            show={showCreateModal}
            onHide={handleCloseModal}
            onPageCreated={handlePageCreated}
          />

          <EditPageModal
            show={showEditModal}
            onHide={handleCloseEditModal}
            onPageUpdated={handlePageUpdated}
            pageId={selectedPageId}
          />
        </div>
      </div>
    </div>
  );
};

export default PaginasTable;