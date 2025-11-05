"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import EventsPage from "@/features/admin/modules/events/EventsPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb
        title="Admin"
        subtitle="Eventos"
        section="Eventos"
      />
      <EventsPage />
    </div>
  );
}
