import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import InvoicesPackagesList from "@/features/admin/modules/InvoicesPackpages/components/InvoicesPackagesList";

export default function ListadoPaquetesPage() {
    return (
        <div className="container-fluid">
            <PageBreadcrumb title="Listado de Paquetes de Facturas" subtitle="Catálogos" section="Admin" />
            <InvoicesPackagesList show={true} />
        </div>
    );
}
