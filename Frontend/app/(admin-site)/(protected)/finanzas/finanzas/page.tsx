import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import FinancePage from "@/features/admin/modules/finance/FinancePage";

export default function Finanzas() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb
        title="Admin"
        subtitle="Finanzas"
        section="Dashboard finanzas"
      />
      <FinancePage />;
    </div>
  );
}
