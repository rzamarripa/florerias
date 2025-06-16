import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import BrandPage from "@/features/admin/modules/brands/BrandsPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Marcas" subtitle="Catálogos" section="Admin" />
      <BrandPage />
    </div>
  );
} 