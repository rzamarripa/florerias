import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import ClientsPage from "@/features/admin/modules/clients/ClientsPage";

export default function page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb
        title="Clientes"
        subtitle="Panel de control"
        section="Admin"
      />
      <ClientsPage />
    </div>
  );
}
