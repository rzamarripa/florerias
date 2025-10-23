import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import StoragePage from "../../../../../features/admin/modules/storage/StoragePage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Almacenes" subtitle="Sucursal" section="Branch" />
      <StoragePage />
    </div>
  );
}
