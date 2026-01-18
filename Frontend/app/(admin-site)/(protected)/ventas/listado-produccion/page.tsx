import ProductionListPage from "@/features/admin/modules/production/ProductionListPage";

export const metadata = {
  title: "Listado de Producción | Corazón Violeta",
  description:
    "Gestiona las órdenes programadas para producción por fecha de entrega",
};

export default function ListadoProduccionPage() {
  return (
    <div className="container-fluid">
      <ProductionListPage />
    </div>
  );
}
