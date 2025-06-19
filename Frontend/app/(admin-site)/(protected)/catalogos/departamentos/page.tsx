import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import DepartmentsPage from "@/features/admin/modules/departments/DepartmentsPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Departamentos" subtitle="Catálogos" section="Admin" />
      <DepartmentsPage/>
    </div>
  );
} 