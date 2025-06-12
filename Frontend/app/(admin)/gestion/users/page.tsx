import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import UsersPage from "@/features/admin/modules/users/UsersPage";

export default function page() {
  return (
    <div>
      <PageBreadcrumb title={"Gestion"} subtitle={"Usuarios"} />
      <UsersPage />
    </div>
  );
}
