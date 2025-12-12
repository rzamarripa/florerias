import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import NewProductListPage from "@/features/admin/modules/product-lists/NewProductListPage";

export default function EditProductListPage() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Admin" subtitle="Catalogos" section="Listas de Productos" />
      <NewProductListPage />
    </div>
  );
}
