import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import RolesPage from "@/features/admin/modules/roles/RolesPage";

export default function page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Roles" subtitle="Gestión" section="Admin" />

      <RolesPage />
    </div>
  );
}
