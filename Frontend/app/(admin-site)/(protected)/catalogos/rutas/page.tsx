import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import Routes from "@/features/admin/modules/routes/Routes";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Rutas" subtitle="Catálogos" section="Admin" />
      < Routes/>
    </div>
  );
}
