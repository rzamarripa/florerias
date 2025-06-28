import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import GastosDashboardPage from "@/features/dashboard/GastosDashboardPage";

const GastosPage = () => {
  return (
    <div className="container-fluid">
      <PageBreadcrumb
        title="Dashboard Gastos"
        subtitle="Dashboard"
        section="Admin"
      />
      <GastosDashboardPage />
    </div>
  );
};

export default GastosPage;
