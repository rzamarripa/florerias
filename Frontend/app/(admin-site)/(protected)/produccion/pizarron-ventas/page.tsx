import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import PizarronVentasPage from "@/features/admin/modules/pizarron-ventas/PizarronVentasPage";

export default function page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb
        title="Pizarrón de Ventas"
        subtitle="Producción"
        section="Admin"
      />
      <PizarronVentasPage />
    </div>
  );
}
