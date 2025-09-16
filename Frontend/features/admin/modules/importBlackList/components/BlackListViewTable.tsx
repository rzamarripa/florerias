import React from "react";
import { Card, Spinner, Table } from "react-bootstrap";
import { FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { BlackListProvider, Pagination } from "../types";

interface BlackListViewTableProps {
  providers: BlackListProvider[];
  pagination: Pagination | null;
  loading: boolean;
  onPageChange: (page: number) => void;
}

const BlackListViewTable: React.FC<BlackListViewTableProps> = ({
  providers,
  pagination,
  loading,
  onPageChange,
}) => {
  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Cargando proveedores...</p>
      </div>
    );
  }

  if (!pagination || providers.length === 0) {
    return (
      <Card className="text-center my-4 border-0 shadow-sm">
        <Card.Body>
          <FileText size={48} className="text-muted mb-3" />
          <h5 className="text-muted">No hay proveedores para mostrar</h5>
          <p className="text-muted">
            No se encontraron proveedores que coincidan con los filtros aplicados.
          </p>
        </Card.Body>
      </Card>
    );
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    
    // Handle Excel date formats
    let date: Date;
    
    // If it's a number (Excel serial date)
    if (!isNaN(Number(dateString))) {
      // Excel serial date to JavaScript Date
      const excelDate = Number(dateString);
      date = new Date((excelDate - 25569) * 86400 * 1000);
    } else {
      // Try to parse as regular date string
      date = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString; // Return original string if can't parse
    }
    
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getPageNumbers = () => {
    const { page, pages } = pagination;
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

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

  const getSituacionBadgeColor = (situacion: string | null | undefined) => {
    if (!situacion) {
      return 'bg-secondary bg-opacity-10 text-secondary';
    }
    
    switch (situacion.toLowerCase()) {
      case 'presunto':
        return 'bg-warning bg-opacity-10 text-warning';
      case 'desvirtuado':
        return 'bg-success bg-opacity-10 text-success';
      case 'definitivo':
        return 'bg-danger bg-opacity-10 text-danger';
      default:
        return 'bg-secondary bg-opacity-10 text-secondary';
    }
  };

  return (
    <Card>
      <div className="table-responsive shadow-sm">
        <Table className="table table-custom table-centered table-select table-hover w-100 mb-0">
          <thead className="bg-light align-middle bg-opacity-25 thead-sm">
            <tr>
              <th className="text-center">#</th>
              <th>RFC</th>
              <th>Nombre</th>
              <th className="text-center">Situación</th>
              <th className="text-center">Oficio Global Presunción</th>
              <th className="text-center">Pub. SAT Presuntos</th>
              <th className="text-center">Pub. DOF Presuntos</th>
              <th className="text-center">Pub. DOF Definitivos</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((provider, index) => (
              <tr key={provider._id}>
                <td className="text-center">
                  <span className="text-muted">
                    {(pagination.page - 1) * pagination.limit + index + 1}
                  </span>
                </td>
                <td>
                  <span className="font-monospace text-muted fw-medium">
                    {provider.rfc}
                  </span>
                </td>
                <td>
                  <span className="fw-medium">{provider.nombre}</span>
                </td>
                <td className="text-center">
                  <span
                    className={`badge fs-6 ${getSituacionBadgeColor(provider.situacion)}`}
                  >
                    {provider.situacion || 'Sin especificar'}
                  </span>
                </td>
                <td className="text-muted text-center">
                  <span className="text-xs">
                    {provider.numeroFechaOficioGlobalPresuncion || '-'}
                  </span>
                </td>
                <td className="text-muted text-center">
                  {formatDate(provider.publicacionPaginaSATPresuntos)}
                </td>
                <td className="text-muted text-center">
                  {formatDate(provider.publicacionDOFPresuntos)}
                </td>
                <td className="text-muted text-center">
                  {formatDate(provider.publicacionDOFDefinitivos)}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {pagination && pagination.pages > 1 && (
          <div className="d-flex justify-content-between align-items-center p-3 border-top">
            <span className="text-muted">
              Mostrando {providers.length} de {pagination.total} registros
            </span>
            <div className="d-flex gap-1 align-items-center">
              <button
                className="btn btn-outline-primary btn-sm d-flex align-items-center"
                disabled={pagination.page === 1}
                onClick={() => onPageChange(pagination.page - 1)}
              >
                <ChevronLeft size={16} />
                Anterior
              </button>

              {getPageNumbers().map((pageNum, index) => (
                <React.Fragment key={index}>
                  {pageNum === "..." ? (
                    <span className="px-2 text-muted">...</span>
                  ) : (
                    <button
                      className={`btn btn-sm ${
                        pageNum === pagination.page
                          ? "btn-primary"
                          : "btn-outline-primary"
                      }`}
                      onClick={() => onPageChange(pageNum as number)}
                    >
                      {pageNum}
                    </button>
                  )}
                </React.Fragment>
              ))}

              <button
                className="btn btn-outline-primary btn-sm d-flex align-items-center"
                disabled={pagination.page === pagination.pages}
                onClick={() => onPageChange(pagination.page + 1)}
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default BlackListViewTable;