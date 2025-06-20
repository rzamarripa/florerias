import React from 'react';
import { Card, Spinner, Table } from 'react-bootstrap';
import { FileText } from 'lucide-react';
import { ImportedInvoice, Pagination } from '../types';

interface InvoicesTableProps {
  invoices: ImportedInvoice[];
  pagination: Pagination | null;
  loading: boolean;
  onPageChange: (page: number) => void;
}

const InvoicesTable: React.FC<InvoicesTableProps> = ({ invoices, pagination, loading, onPageChange }) => {
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
          <p className="text-muted">Seleccione una Razón Social para ver sus facturas o importe un nuevo archivo.</p>
        </Card.Body>
      </Card>
    );
  }
  
  const formatCurrency = (value: number | any) => {
    const numberValue = Number(value);
    if (isNaN(numberValue)) {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(0);
    }
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(numberValue);
  };
  
  const formatDate = (dateString?: string | null) => {
     if (!dateString) return '-';
     return new Date(dateString).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
     });
  }

  return (
    <Card>
      <div className="table-responsive shadow-sm">
        <Table className="table table-custom table-centered table-select table-hover w-100 mb-0">
          <thead className="bg-light align-middle bg-opacity-25 thead-sm">
            <tr>
              <th className="text-center">#</th>
              <th>UUID</th>
              <th>Proveedor</th>
              <th className="text-end">Importe</th>
              <th className="text-center">Estatus</th>
              <th>Fecha Emisión</th>
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
                  <span className="font-monospace text-muted">{invoice.fiscalFolioId}</span>
                </td>
                <td>
                  <span className="fw-medium">{invoice.issuerName}</span>
                </td>
                <td className="text-end fw-medium">{formatCurrency(Number(invoice.amount))}</td>
                <td className="text-center">
                    <span
                        className={`badge fs-6 ${
                        invoice.status === 1
                            ? "bg-success bg-opacity-10 text-success"
                            : "bg-danger bg-opacity-10 text-danger"
                        }`}
                    >
                        {invoice.status === 1 ? "Activa" : "Cancelada"}
                    </span>
                </td>
                <td className="text-muted">{formatDate(invoice.issuanceDate)}</td>
              </tr>
            ))}
          </tbody>
        </Table>

        {pagination && pagination.pages > 1 && (
            <div className="d-flex justify-content-between align-items-center p-3 border-top">
                <span className="text-muted">
                    Mostrando {invoices.length} de {pagination.total} registros
                </span>
                <div className="d-flex gap-1">
                    <button
                        className="btn btn-outline-primary btn-sm"
                        disabled={pagination.page === 1}
                        onClick={() => onPageChange(pagination.page - 1)}
                    >
                        Anterior
                    </button>
                    <button
                        className="btn btn-primary btn-sm"
                    >
                        {pagination.page}
                    </button>
                    <button
                        className="btn btn-outline-primary btn-sm"
                        disabled={pagination.page === pagination.pages}
                        onClick={() => onPageChange(pagination.page + 1)}
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        )}
      </div>
    </Card>
  );
};

export default InvoicesTable; 