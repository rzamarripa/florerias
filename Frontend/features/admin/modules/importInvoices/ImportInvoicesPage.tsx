"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FileText } from "lucide-react";

const ImportInvoicesPage: React.FC = () => {
  return (
    <div className="import-invoices-page">
      <Card className="shadow-sm">
        <CardHeader className="bg-white py-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h5 className="mb-0 font-bold">Importar CFDI</h5>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta pagina esta en desarrollo. Aqui podras importar archivos CFDI (Facturas).
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportInvoicesPage;
