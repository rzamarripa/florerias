import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import ProductRewardsPage from "@/features/admin/modules/pointsConfig/ProductRewardsPage";

export default function page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb
        title="Productos como Recompensa"
        subtitle="Configuracion de Puntos"
        section="Admin"
      />
      <ProductRewardsPage />
    </div>
  );
}
