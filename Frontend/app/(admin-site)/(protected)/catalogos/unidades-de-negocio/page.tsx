import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import CategoriesPage from "@/features/admin/modules/categories/CategoryPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Categorías" subtitle="Catálogos" section="Admin" />
      <CategoriesPage/>
    </div>
  );
} 