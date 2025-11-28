import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import PizarronEnvioPage from "@/features/admin/modules/pizarron-ventas/PizarronEnvioPage";

export default function page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb
        title="Pizarrón de Envío"
        subtitle="Producción"
        section="Admin"
      />
      <PizarronEnvioPage />
    </div>
  );
}
