"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import NeighborhoodsTable from "./components/NeighborhoodsTable";
import NeighborhoodModal from "./components/NeighborhoodModal";
import { Neighborhood } from "./types";

import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

const NeighborhoodsPage: React.FC = () => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const handleOpenModal = (neighborhood?: Neighborhood) => {
    setSelectedNeighborhood(neighborhood || null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedNeighborhood(null);
  };

  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="Colonias"
        description="Gestiona las colonias y sus precios de entrega"
        action={{
          label: "Nueva Colonia",
          icon: <Plus className="h-4 w-4" />,
          onClick: () => handleOpenModal(),
        }}
      />

      {/* Tabla en Card */}
      <Card>
        <CardContent className="p-4">
          <NeighborhoodsTable
            onEdit={handleOpenModal}
            refreshTrigger={refreshTrigger}
          />
        </CardContent>
      </Card>

      {/* Modal de Creación/Edición */}
      <NeighborhoodModal
        show={showModal}
        onHide={handleCloseModal}
        onSuccess={handleSuccess}
        neighborhood={selectedNeighborhood}
      />
    </div>
  );
};

export default NeighborhoodsPage;
