"use client";

import { useState, useEffect, useMemo } from "react";
import { Modal, Button, Form, Row, Col, Spinner, Alert } from "react-bootstrap";
import { Branch, useActiveBranchStore } from "@/stores/activeBranchStore";
import BranchCard from "./BranchCard";
import { TbSearch, TbX } from "react-icons/tb";
import { branchesService } from "@/features/admin/modules/branches/services/branches";

interface BranchSelectionModalProps {
  show: boolean;
  onHide: () => void;
}

const BranchSelectionModal = ({ show, onHide }: BranchSelectionModalProps) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const { activeBranch, setActiveBranch } = useActiveBranchStore();

  // Cargar sucursales del usuario
  useEffect(() => {
    const fetchBranches = async () => {
      if (!show) return;

      setLoading(true);
      setError(null);

      try {
        const result = await branchesService.getUserBranches();

        if (result.success) {
          setBranches(result.data);
          // Preseleccionar la sucursal activa si existe
          if (activeBranch) {
            setSelectedBranch(activeBranch);
          }
        } else {
          throw new Error("Error al cargar las sucursales");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, [show, activeBranch]);

  // Filtrar sucursales por nombre
  const filteredBranches = useMemo(() => {
    if (!searchTerm.trim()) return branches;

    return branches.filter((branch) =>
      branch.branchName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [branches, searchTerm]);

  const handleSelectBranch = (branch: Branch) => {
    setSelectedBranch(branch);
  };

  const handleConfirm = () => {
    if (selectedBranch) {
      setActiveBranch(selectedBranch);
      onHide();
    }
  };

  const handleCancel = () => {
    setSelectedBranch(activeBranch);
    setSearchTerm("");
    onHide();
  };

  return (
    <Modal show={show} onHide={handleCancel} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>Seleccionar Sucursal</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Buscador */}
        <div className="mb-4">
          <Form.Group>
            <div className="position-relative">
              <Form.Control
                type="text"
                placeholder="Buscar sucursal por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-5"
              />
              <TbSearch
                className="position-absolute top-50 translate-middle-y ms-3"
                size={20}
                style={{ left: 0 }}
              />
              {searchTerm && (
                <Button
                  variant="link"
                  className="position-absolute top-50 translate-middle-y end-0 me-2 p-0"
                  onClick={() => setSearchTerm("")}
                >
                  <TbX size={20} />
                </Button>
              )}
            </div>
          </Form.Group>
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Cargando sucursales...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">
            <Alert.Heading>Error</Alert.Heading>
            <p>{error}</p>
          </Alert>
        ) : filteredBranches.length === 0 ? (
          <Alert variant="info">
            {searchTerm
              ? "No se encontraron sucursales que coincidan con la búsqueda"
              : "No tienes sucursales asignadas"}
          </Alert>
        ) : (
          <Row className="g-3">
            {filteredBranches.map((branch) => (
              <Col key={branch._id} xs={12} md={6} lg={4}>
                <BranchCard
                  branch={branch}
                  isActive={selectedBranch?._id === branch._id}
                  onSelect={handleSelectBranch}
                />
              </Col>
            ))}
          </Row>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleCancel}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={!selectedBranch || loading}
        >
          Confirmar Selección
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default BranchSelectionModal;
