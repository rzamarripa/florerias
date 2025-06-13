import React, { useState, useEffect } from "react";
import { Search, Plus, Edit, FileText, Loader2, Trash } from "lucide-react";
import styles from "./pages.module.css";
import { pagesService, Page } from "./services/pages";
import CreatePageModal from "./components/addpage/AddPageModal";
import EditPageModal from "./components/editPage/EditPagesModal"; 

const PaginasTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("todos");
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  const fetchPages = async () => {
    try {
      setLoading(true);
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
      setError(
        err instanceof Error ? err.message : "Error al cargar las páginas"
      );
      console.error("Error fetching pages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
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
    fetchPages();
  };

  // Funciones para el modal de edición
  const handleEditPageClick = (pageId: string): void => {
    setSelectedPageId(pageId);
    setShowEditModal(true);
  };

  const handleCloseEditModal = (): void => {
    setShowEditModal(false);
    setSelectedPageId(null);
  };

  const handlePageUpdated = (): void => {
    fetchPages();
  };

  const clearError = (): void => {
    setError(null);
  };
  
  const handleDeletePage = async (id: string) => {
    const response = await pagesService.deletePage(id)
    if(response.success){
      fetchPages()
    }
    console.log(response)
  }

  return (
    <div className="container-fluid py-4 px-0">
      {error && (
        <div className={`alert alert-danger alert-dismissible fade show mb-4 mx-4`}>
          <strong>Error:</strong> {error}
          <button
            type="button"
            className="btn-close"
            onClick={clearError}
            aria-label="Close"
          />
        </div>
      )}

      <div className="row h-100 mx-0">
        <div className="col px-0">
          <div
            className={`card shadow-sm border-0 h-100 d-flex flex-column ${styles.card}`}
          >
            <div
              className={`card-header bg-white border-0 pt-4 pb-3 px-4 ${styles.cardHeader}`}
            >
              <div className="d-flex align-items-center justify-content-between w-100">
                <div className="d-flex align-items-center">
                  <div
                    className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${styles.iconCircle}`}
                  >
                    <FileText size={24} />
                  </div>
                  <div>
                    <h2 className={`mb-1 ${styles.fwBold} text-dark`}>
                      Páginas
                      <span className={`badge ms-2 ${styles.countBadge}`}>
                        {filteredPaginas.length}
                      </span>
                    </h2>
                    <p className={`${styles.textMuted} mb-0`}>
                      Lista de páginas del sistema
                    </p>
                  </div>
                </div>
                
                <button
                  className={`btn btn-sm px-3 ${styles.fwSemibold} ${styles.newPageBtn}`}
                  style={{ marginRight: '-1rem' }}
                  onClick={handleNewPageClick}
                  type="button"
                >
                  <Plus size={16} className="me-2" />
                  Nueva Página
                </button>
              </div>
            </div>

            <div className={`card-body px-4 flex-grow-1 ${styles.cardBody}`}>
              {/* Filtros y búsqueda */}
              <div className={`row mb-4 ${styles.stickyTop} bg-white py-2`}>
                <div className="col-md-4">
                  <div className="input-group">
                    <span
                      className={`input-group-text bg-light border-end-0 ${styles.inputGroupText}`}
                    >
                      <Search size={16} className={styles.textMuted} />
                    </span>
                    <input
                      type="text"
                      className={`form-control border-start-0 ps-0 ${styles.formControl}`}
                      placeholder="Buscar páginas..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <select
                    className={`form-select ${styles.formSelect}`}
                    value={selectedType}
                    onChange={handleTypeChange}
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="activos">Páginas activas</option>
                    <option value="inactivos">Páginas inactivas</option>
                  </select>
                </div>
              </div>

              {/* Tabla */}
              <div className={`bg-white rounded ${styles.tableResponsive}`}>
                <table className={`table table-hover mb-0 ${styles.table}`}>
                  <thead className={`${styles.stickyTop} bg-white`}>
                    <tr className={styles.borderBottom2}>
                      <th
                        className={`${styles.fwSemibold} ${styles.textMuted} py-3`}
                      >
                        #
                      </th>
                      <th
                        className={`${styles.fwSemibold} ${styles.textMuted} py-3`}
                      >
                        Página
                      </th>
                      <th
                        className={`${styles.fwSemibold} ${styles.textMuted} py-3`}
                      >
                        Ruta
                      </th>
                      <th
                        className={`${styles.fwSemibold} ${styles.textMuted} py-3`}
                      >
                        Estado
                      </th>
                      <th
                        className={`${styles.fwSemibold} ${styles.textMuted} py-3`}
                      >
                        Fecha Creación
                      </th>
                      <th
                        className={`${styles.fwSemibold} ${styles.textMuted} py-3`}
                      >
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-5">
                          <div className="d-flex flex-column align-items-center">
                            <Loader2
                              size={32}
                              className={`${styles.textMuted} mb-2`}
                              style={{ animation: "spin 1s linear infinite" }}
                            />
                            <p className={styles.textMuted}>
                              Cargando páginas...
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredPaginas.map((pagina: Page, index: number) => {
                        return (
                          <tr key={pagina._id} className="border-bottom">
                            <td className="py-3 align-middle">
                              <span
                                className={`${styles.textMuted} ${styles.fwMedium}`}
                              >
                                {index + 1}
                              </span>
                            </td>
                            <td className="py-3 align-middle">
                              <div>
                                <div
                                  className={`${styles.fwSemibold} text-dark mb-0`}
                                >
                                  {pagina.name}
                                </div>
                                {pagina.description && (
                                  <small className={styles.textMuted}>
                                    {pagina.description}
                                  </small>
                                )}
                              </div>
                            </td>
                            <td className="py-3 align-middle">
                              <code
                                className={`${styles.textMuted} px-2 py-1 rounded ${styles.codeTag} ${styles.codeBackground}`}
                              >
                                {pagina.path}
                              </code>
                            </td>
                            <td className="py-3 align-middle">
                              <span
                                className={`badge ${
                                  pagina.status ? "bg-success" : "bg-secondary"
                                }`}
                              >
                                {pagina.status ? "Activo" : "Inactivo"}
                              </span>
                            </td>
                            <td className="py-3 align-middle">
                              <span className={styles.textMuted}>
                                {new Date(pagina.createdAt).toLocaleDateString(
                                  "es-ES",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                              </span>
                            </td>
                            <td className="py-3 align-middle">
                              <div className="d-flex justify-content-start align-items-center">
                                <Edit
                                  onClick={() => handleEditPageClick(pagina._id)}
                                  style={{
                                    fontSize: "1.3rem",
                                    marginRight: "2rem",
                                    cursor: "pointer",
                                  }}
                                  className="text-success"
                                />
                                <Trash
                                  onClick={() => handleDeletePage(pagina._id)}
                                  style={{
                                    fontSize: "1.3rem",
                                    cursor: "pointer",
                                  }}
                                  className="text-danger trash-icon"
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {!loading && filteredPaginas.length === 0 && (
                <div className={styles.emptyState}>
                  <FileText size={48} className={`${styles.textMuted} mb-3`} />
                  <h5 className={styles.textMuted}>
                    No se encontraron páginas
                  </h5>
                  <p className={styles.textMuted}>
                    {searchTerm || selectedType !== "todos"
                      ? "Intenta cambiar los filtros de búsqueda"
                      : "No hay páginas disponibles en el sistema"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para crear nueva página */}
      <CreatePageModal
        show={showCreateModal}
        onHide={handleCloseModal}
        onPageCreated={handlePageCreated}
      />

      {/* Modal para editar página */}
      <EditPageModal
        show={showEditModal}
        onHide={handleCloseEditModal}
        onPageUpdated={handlePageUpdated}
        pageId={selectedPageId}
      />
    </div>
  );
};

export default PaginasTable;