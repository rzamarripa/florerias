'use client';
import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import BankMovementsImportPage from '@/features/admin/modules/bankMovements/BankMovementsImportPage';

export default function ImportarMovimientosBancariosPage() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Importar Movimientos Bancarios" subtitle="Herramientas" section="Admin" />
      <BankMovementsImportPage />
    </div>
  );
} 