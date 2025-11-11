import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import CashRegistersPage from "@/features/admin/modules/cash-registers/CashRegistersPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Cajas" subtitle="Sucursal" section="Admin" />
      <CashRegistersPage />;
    </div>
  );
}
