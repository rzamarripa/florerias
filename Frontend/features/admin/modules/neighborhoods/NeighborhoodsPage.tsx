"use client";

import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { Plus } from "lucide-react";
import NeighborhoodsTable from "./components/NeighborhoodsTable";
import NeighborhoodModal from "./components/NeighborhoodModal";
import { Neighborhood } from "./types";

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
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h2 className="mb-1 fw-bold">Colonias</h2>
            <p className="text-muted mb-0">
              Gestiona las colonias y sus precios de entrega
            </p>
          </div>

          {/* Botón de nueva colonia */}
          <Button
            variant="primary"
            onClick={() => handleOpenModal()}
            className="d-flex align-items-center gap-2"
          >
            <Plus size={18} />
            Nueva Colonia
          </Button>
        </div>
      </div>

      {/* Tabla en Card */}
      <div
        className="card border-0 shadow-sm"
        style={{ borderRadius: "15px" }}
      >
        <div className="card-body p-4">
          <NeighborhoodsTable
            onEdit={handleOpenModal}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>

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
