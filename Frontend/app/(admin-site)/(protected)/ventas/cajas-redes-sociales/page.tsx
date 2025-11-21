import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import SocialMediaCashRegistersPage from "@/features/admin/modules/cash-registers/SocialMediaCashRegistersPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Cajas Redes Sociales" subtitle="Ventas" section="Admin" />
      <SocialMediaCashRegistersPage />;
    </div>
  );
}
