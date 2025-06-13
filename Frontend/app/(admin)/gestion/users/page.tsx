import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import UsersPage from "@/features/admin/modules/users/UsersPage";

export default function page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Usuarios" subtitle="Gestión" section="Admin" />
      <UsersPage />
    </div>
  );
}
