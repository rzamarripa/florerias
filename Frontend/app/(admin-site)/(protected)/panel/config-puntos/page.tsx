import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import PointsConfigPage from "@/features/admin/modules/pointsConfig/PointsConfigPage";

export default function page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb
        title="Configuración de Puntos"
        subtitle="Panel de control"
        section="Admin"
      />
      <PointsConfigPage />
    </div>
  );
}
