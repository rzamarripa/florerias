import { FileText, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Alert, Button, Form, Table, Spinner } from "react-bootstrap";
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
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const fetchPages = async (showLoading: boolean = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      const response = await pagesService.getAllPages({
        page: pagination.page,
        limit: pagination.limit,
        ...(searchTerm && { name: searchTerm }),
        ...(selectedType === "activos" && { status: "true" }),
        ...(selectedType === "inactivos" && { status: "false" }),
      });

      if (response.success && response.data) {
        setPages(response.data);
        setPagination({
          page: 1,
          limit: 15,
          total: response.data.length,
          pages: Math.ceil(response.data.length / 15),
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al cargar las páginas";
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

  const getPageStatus = (id: string): boolean => {
    return pages.find((page) => page._id === id)?.status || false;
  };

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
          toast.success(
            `Página "${currentPage.name}" desactivada correctamente`
          );
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
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";

      console.error("Error toggling page status:", err);
      toast.error(`Error al ${action} ${pageName}: ${errorMessage}`);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
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
            {loading ? (
              <div className="text-center my-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : pages.length === 0 ? (
              <div className="text-center my-5">
                <FileText size={48} className="text-muted mb-2" />
                <p className="text-muted">No hay páginas registradas</p>
              </div>
            ) : (
              <>
                <Table className="table table-custom table-centered table-select table-hover w-100 mb-0">
                  <thead className="bg-light align-middle bg-opacity-25 thead-sm">
                    <tr>
                      <th className="text-center">#</th>
                      <th>Nombre</th>
                      <th>Ruta</th>
                      <th>Descripción</th>
                      <th className="text-center">Estatus</th>
                      <th className="text-center text-nowrap">Fecha creación</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pages.map((pagina, index) => (
                      <tr key={pagina._id}>
                        <td className="text-center">
                          <span className="text-muted">
                            {(pagination.page - 1) * pagination.limit + index + 1}
                          </span>
                        </td>
                        <td>
                          <span className="fw-medium">{pagina.name}</span>
                        </td>
                        <td>
                          <span>{pagina.path}</span>
                        </td>
                        <td>
                          <span>{pagina.description || "-"}</span>
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
                            {new Date(pagina.createdAt).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
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
                              title={
                                getPageStatus(pagina._id)
                                  ? "Desactivar página"
                                  : "Activar página"
                              }
                              onClick={() => handleTooglePage(pagina._id)}
                            >
                              {getPageStatus(pagina._id) ? (
                                <FiTrash2 size={16} />
                              ) : (
                                <BsCheck2 size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                <div className="d-flex justify-content-between align-items-center p-3 border-top">
                  <span className="text-muted">
                    Mostrando {pages.length} de {pagination.total} registros
                  </span>
                  <div className="d-flex gap-1 align-items-center">
                    <button
                      className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                      disabled={pagination.page === 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      <ChevronLeft size={16} />
                      Anterior
                    </button>

                    {getPageNumbers().map((pageNum, index) => (
                      <React.Fragment key={index}>
                        {pageNum === '...' ? (
                          <span className="px-2 text-muted">...</span>
                        ) : (
                          <button
                            className={`btn btn-sm ${pageNum === pagination.page
                              ? 'btn-primary'
                              : 'btn-outline-secondary'
                              }`}
                            onClick={() => handlePageChange(pageNum as number)}
                          >
                            {pageNum}
                          </button>
                        )}
                      </React.Fragment>
                    ))}

                    <button
                      className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                      disabled={pagination.page === pagination.pages}
                      onClick={() => handlePageChange(pagination.page + 1)}
                    >
                      Siguiente
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
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
