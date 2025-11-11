import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import CashCountPage from "@/features/admin/modules/cash-count/CashCountPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Empresas" subtitle="Gestión" section="Admin" />
      <CashCountPage />;
    </div>
  );
}
