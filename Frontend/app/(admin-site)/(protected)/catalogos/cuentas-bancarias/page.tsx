import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import BankAccountsPage from "@/features/admin/modules/bankAccounts/BankAccountsPage";

export default function CuentasBancariasPage() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Cuentas Bancarias" subtitle="Catálogos" section="Admin" />
      <BankAccountsPage />
    </div>
  );
} 