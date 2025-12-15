"use client";

import React from "react";
import { Card } from "react-bootstrap";
import { FileText } from "lucide-react";

const ImportInvoicesPage: React.FC = () => {
  return (
    <div className="import-invoices-page">
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0 py-3">
          <div className="d-flex align-items-center gap-2">
            <FileText size={20} className="text-primary" />
            <h5 className="mb-0 fw-bold">Importar CFDI</h5>
          </div>
        </Card.Header>
        <Card.Body>
          <p className="text-muted">
            Esta página está en desarrollo. Aquí podrás importar archivos CFDI (Facturas).
          </p>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ImportInvoicesPage;
