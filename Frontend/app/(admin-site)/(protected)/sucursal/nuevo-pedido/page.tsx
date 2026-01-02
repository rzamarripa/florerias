import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import NewOrderPage from "@/features/admin/modules/orders/NewOrderPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb
        title="Nuevo Pedido"
        subtitle="Sucursal"
        section="Branch"
      />
      <NewOrderPage />
    </div>
  );
}
