import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import CashRegisterSummaryPage from "@/features/admin/modules/cash-registers/CashRegisterSummaryPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb
        title="Cierre de caja"
        subtitle="Sucursal"
        section="Admin"
      />
      <CashRegisterSummaryPage />;
    </div>
  );
}
