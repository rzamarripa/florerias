import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import CategoriesPage from "@/features/admin/modules/categories/CategoryPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Unidades de Negocio" subtitle="Catálogos" section="Admin" />
      <CategoriesPage />
    </div>
  );
} 