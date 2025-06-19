import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import BanksPage from "@/features/admin/modules/banks/BanksPage";

export default function BancosPage() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Bancos" subtitle="Catálogos" section="Admin" />
      <BanksPage />
    </div>
  );
} 