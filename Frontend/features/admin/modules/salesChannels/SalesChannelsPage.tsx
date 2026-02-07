"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import SalesChannelsTable from "./components/SalesChannelsTable";
import SalesChannelModal from "./components/SalesChannelModal";
import { SalesChannel } from "./types";

import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

const SalesChannelsPage: React.FC = () => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedChannel, setSelectedChannel] = useState<SalesChannel | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const handleOpenModal = (channel?: SalesChannel) => {
    setSelectedChannel(channel || null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedChannel(null);
  };

  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="Canales de Venta"
        description="Gestiona los canales de venta de tu empresa"
        action={{
          label: "Nuevo Canal",
          icon: <Plus className="h-4 w-4" />,
          onClick: () => handleOpenModal(),
        }}
      />

      {/* Tabla en Card */}
      <Card>
        <CardContent className="p-4">
          <SalesChannelsTable
            onEdit={handleOpenModal}
            refreshTrigger={refreshTrigger}
          />
        </CardContent>
      </Card>

      {/* Modal de Creación/Edición */}
      <SalesChannelModal
        show={showModal}
        onHide={handleCloseModal}
        onSuccess={handleSuccess}
        salesChannel={selectedChannel}
      />
    </div>
  );
};

export default SalesChannelsPage;