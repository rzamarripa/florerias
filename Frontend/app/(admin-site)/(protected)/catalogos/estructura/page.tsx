import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import Structure from "@/features/admin/modules/structure/Structure";

export default function EstructuraPage() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb
        title="Estructura Organizacional"
        subtitle="Catálogos"
        section="Admin"
      />
      <Structure />
    </div>
  );
}
