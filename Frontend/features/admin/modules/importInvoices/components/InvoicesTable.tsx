import React from "react";
import { Card, Spinner, Table } from "react-bootstrap";
import { FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { ImportedInvoice, Pagination } from "../types";
import { formatCurrency } from "@/utils";

interface InvoicesTableProps {
  invoices: ImportedInvoice[];
  pagination: Pagination | null;
  loading: boolean;
  onPageChange: (page: number) => void;
  isPreview?: boolean;
}

const InvoicesTable: React.FC<InvoicesTableProps> = ({
  invoices,
  pagination,
  loading,
  onPageChange,
}) => {
  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Cargando facturas...</p>
      </div>
    );
  }

  if (!pagination || invoices.length === 0) {
    return (
      <Card className="text-center my-4 border-0 shadow-sm">
        <Card.Body>
          <FileText size={48} className="text-muted mb-3" />
          <h5 className="text-muted">No hay facturas para mostrar</h5>
          <p className="text-muted">
            Seleccione una Razón Social para ver sus facturas o importe un nuevo
            archivo.
          </p>
        </Card.Body>
      </Card>
    );
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("es-MX", {
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

  return (
    <Card>
      <div className="table-responsive shadow-sm">
        <Table className="table table-custom table-centered table-select table-hover w-100 mb-0">
          <thead className="bg-light align-middle bg-opacity-25 thead-sm">
            <tr>
              <th className="text-center">#</th>
              <th>Proveedor</th>
              <th>RFC Emisor</th>
              <th>Fecha Emisión</th>
              <th className="text-center">Estatus</th>
              <th>Fecha Cancelación</th>
              <th className="text-end">Importe</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice, index) => (
              <tr key={invoice._id}>
                <td className="text-center">
                  <span className="text-muted">
                    {(pagination.page - 1) * pagination.limit + index + 1}
                  </span>
                </td>
                <td>
                  <span className="fw-medium">{invoice.nombreEmisor}</span>
                </td>
                <td>
                  <span className="font-monospace text-muted">
                    {invoice.rfcEmisor}
                  </span>
                </td>
                <td className="text-muted">
                  {formatDate(invoice.fechaEmision)}
                </td>
                <td className="text-center">
                  <span
                    className={`badge fs-6 ${
                      invoice.estatus === 1
                        ? "bg-success bg-opacity-10 text-success"
                        : "bg-danger bg-opacity-10 text-danger"
                    }`}
                  >
                    {invoice.estatus === 1 ? "Vigente" : "Cancelado"}
                  </span>
                </td>
                <td className="text-muted">
                  {formatDate(invoice.fechaCancelacion)}
                </td>
                <td className="text-end fw-medium">
                  {formatCurrency(Number(invoice.importeAPagar))}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {pagination && pagination.pages > 1 && (
          <div className="d-flex justify-content-between align-items-center p-3 border-top">
            <span className="text-muted">
              Mostrando {invoices.length} de {pagination.total} registros
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

export default InvoicesTable;
