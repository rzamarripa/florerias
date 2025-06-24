import React, { useEffect, useState } from "react";
import { Button, Modal, Table } from "react-bootstrap";
import { FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import { Brand, brandsService } from "../services/brands";
import { branchService } from "../services/branch";
import { Branch } from "../types";

interface BranchBrandsModalProps {
  branch: Branch;
  onBrandsSaved?: () => void;
  buttonProps?: {
    variant?: string;
    size?: "sm" | "lg";
    className?: string;
    title?: string;
  };
  children?: React.ReactNode;
}

const BranchBrandsModal: React.FC<BranchBrandsModalProps> = ({
  branch,
  onBrandsSaved,
  buttonProps = {},
  children,
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingBranchBrands, setLoadingBranchBrands] = useState<boolean>(false);

  useEffect(() => {
    if (showModal) {
      loadBrands();
      loadBranchBrands();
    }
  }, [showModal]);

  const loadBrands = async () => {
    try {
      setLoading(true);
      const response = await brandsService.getAll({
        page: 1,
        limit: 100,
        isActive: true,
      });
      if (response.success && response.data) {
        setBrands(response.data);
      }
    } catch (error) {
      console.error("Error loading brands:", error);
      toast.error("Error al cargar las marcas");
    } finally {
      setLoading(false);
    }
  };

  const loadBranchBrands = async () => {
    try {
      setLoadingBranchBrands(true);
      const response = await branchService.getBranchBrands(branch._id);
      if (response.success && response.data) {
        const brandIds = response.data.map((brand: Brand) => brand._id);
        setSelectedBrands(brandIds);
      }
    } catch (error) {
      console.error("Error loading branch brands:", error);
      toast.error("Error al cargar las marcas de la sucursal");
    } finally {
      setLoadingBranchBrands(false);
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBrands([]);
  };

  const handleRemoveBrand = (brandId: string) => {
    setSelectedBrands(selectedBrands.filter(id => id !== brandId));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await branchService.assignBrandsToBranch(
        branch._id,
        selectedBrands
      );
      if (response.success) {
        toast.success("Marcas asignadas correctamente");
        onBrandsSaved?.();
        handleCloseModal();
      } else {
        toast.error(response.message || "Error al asignar marcas");
      }
    } catch (error) {
      console.error("Error saving brands:", error);
      toast.error("Error al guardar las marcas");
    } finally {
      setLoading(false);
    }
  };

  const getSelectedBrandsData = () => {
    return selectedBrands.map(brandId => {
      const brand = brands.find(b => b._id === brandId);
      return brand || { _id: brandId, name: "Cargando...", description: "" };
    });
  };

  return (
    <>
      <button
        className={`btn btn-${buttonProps.variant || "light"} btn-${
          buttonProps.size || "sm"
        } ${buttonProps.className || ""}`}
        title={buttonProps.title || "Ver marcas"}
        onClick={handleOpenModal}
      >
        {children || "Marcas"}
      </button>

      <Modal
        show={showModal}
        onHide={handleCloseModal}
        size="lg"
        centered
        backdrop="static"
        keyboard={!loading}
      >
        <Modal.Header closeButton className="border-0 pb-2 pt-3">
          <Modal.Title className="text-dark fs-5">
            Marcas de la Sucursal - {branch.name}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="px-4 py-2">
          <div className="table-responsive" style={{ maxHeight: "400px" }}>
            <Table className="table table-hover table-sm">
              <thead className="bg-light sticky-top">
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th style={{ width: "80px" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loadingBranchBrands ? (
                  <tr>
                    <td colSpan={3} className="text-center py-3">
                      <div
                        className="spinner-border spinner-border-sm"
                        role="status"
                      >
                        <span className="visually-hidden">Cargando marcas asignadas...</span>
                      </div>
                    </td>
                  </tr>
                ) : selectedBrands.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-3 text-muted">
                      No hay marcas asignadas
                    </td>
                  </tr>
                ) : (
                  getSelectedBrandsData().map((brand) => (
                    <tr key={brand._id}>
                      <td>{brand.name}</td>
                      <td>{brand.description || "-"}</td>
                      <td>
                        <Button
                          className="btn btn-light btn-icon btn-sm rounded-circle"
                          size="sm"
                          onClick={() => handleRemoveBrand(brand._id)}
                          disabled={loading}
                          title="Remover marca"
                        >
                          <FiTrash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>

          <div className="mt-3 text-muted small">
            {selectedBrands.length > 0 && (
              <span>Marcas asignadas: {selectedBrands.length}</span>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer className="border-0 pt-2 pb-3">
          <Button variant="light" onClick={handleCloseModal} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default BranchBrandsModal; 