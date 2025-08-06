import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import BankNumbersPage from "@/features/admin/modules/bankNumbers/BankNumbersPage";

export default function BankNumbersPageRoute() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb
        title="Numero de bancos"
        subtitle="Bancos"
        section="Admin"
      />
      <BankNumbersPage />
    </div>
  );
}
