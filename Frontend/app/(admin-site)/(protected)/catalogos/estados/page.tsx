import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import StatePage from "@/features/admin/modules/states/StatePage";

export default function Page() {
    return (
        <div className="container-fluid">
            <PageBreadcrumb title="Razones Sociales" subtitle="Catálogos" section="Admin" />
            <StatePage />
        </div>
    );
} 