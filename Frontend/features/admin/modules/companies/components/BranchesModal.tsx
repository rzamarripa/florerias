"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Table, Spinner, Alert } from "react-bootstrap";
import Select from "react-select";
import { X, Save } from "lucide-react";
import { toast } from "react-toastify";
import { Company } from "../types";
import { companiesService } from "../services/companies";

interface Branch {
  _id: string;
  branchName: string;
  branchCode?: string;
  address: {
    city: string;
    state: string;
  };
  manager: {
    name: string;
    email: string;
    phone: string;
  };
  isActive: boolean;
}

interface BranchOption {
  value: string;
  label: string;
  branch: Branch;
}

interface BranchesModalProps {
  show: boolean;
  onHide: () => void;
  company: Company;
  onBranchesUpdated?: () => void;
}

const BranchesModal: React.FC<BranchesModalProps> = ({
  show,
  onHide,
  company,
  onBranchesUpdated,
}) => {
  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      loadBranches();
    }
  }, [show]);

  // Actualizar las opciones seleccionadas cuando cambian las sucursales o la empresa
  useEffect(() => {
    if (allBranches.length > 0) {
      const currentBranchIds =
        company.branches?.map((b: any) => (typeof b === "string" ? b : b._id)) || [];
      setSelectedBranchIds(currentBranchIds);

      const options = currentBranchIds
        .map((id) => {
          const branch = allBranches.find((b) => b._id === id);
          if (branch) {
            return {
              value: branch._id,
              label: `${branch.branchName}${branch.branchCode ? ` (${branch.branchCode})` : ""} - ${branch.address.city}, ${branch.address.state}`,
              branch,
            };
          }
          return null;
        })
        .filter((opt): opt is BranchOption => opt !== null);

      setSelectedOptions(options);
    }
  }, [allBranches, company]);

  const loadBranches = async () => {
    try {
      setLoading(true);
      setError(null);
      // Obtener todas las sucursales activas
      const response = await companiesService.getAllBranches({ isActive: true });
      setAllBranches(response.data || []);
    } catch (err: any) {
      console.error("Error al cargar sucursales:", err);
      setError(err.message || "Error al cargar las sucursales");
    } finally {
      setLoading(false);
    }
  };

  const handleBranchSelection = (newValue: readonly BranchOption[]) => {
    setSelectedOptions(newValue as BranchOption[]);
    setSelectedBranchIds(newValue.map((opt) => opt.value));
  };

  const getBranchOptions = (): BranchOption[] => {
    return allBranches.map((branch) => ({
      value: branch._id,
      label: `${branch.branchName}${branch.branchCode ? ` (${branch.branchCode})` : ""} - ${branch.address.city}, ${branch.address.state}`,
      branch,
    }));
  };

  const handleRemoveBranch = (branchId: string) => {
    const newSelectedIds = selectedBranchIds.filter((id) => id !== branchId);
    const newSelectedOptions = selectedOptions.filter((opt) => opt.value !== branchId);
    setSelectedBranchIds(newSelectedIds);
    setSelectedOptions(newSelectedOptions);
  };

  const getSelectedBranches = (): Branch[] => {
    return allBranches.filter((branch) => selectedBranchIds.includes(branch._id));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await companiesService.updateCompanyBranches(company._id, selectedBranchIds);
      toast.success("Sucursales actualizadas exitosamente");
      onBranchesUpdated?.();
      onHide();
    } catch (err: any) {
      const errorMessage = err.message || "Error al actualizar las sucursales";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onHide();
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Agregar Sucursales - {company.legalName}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <>
            {/* Multiselect de Sucursales con React-Select */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">
                Seleccionar Sucursales
              </Form.Label>
              <Select
                isMulti
                options={getBranchOptions()}
                value={selectedOptions}
                onChange={handleBranchSelection}
                placeholder="Selecciona sucursales..."
                noOptionsMessage={() => "No hay sucursales disponibles"}
                className="react-select-container"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: "42px",
                  }),
                  menuPortal: (base) => ({
                    ...base,
                    zIndex: 9999,
                  }),
                }}
                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              />
            </Form.Group>

            {/* Tabla de Sucursales Seleccionadas */}
            <div className="mt-4">
              <h6 className="fw-semibold mb-3">
                Sucursales Asignadas ({getSelectedBranches().length})
              </h6>
              {getSelectedBranches().length === 0 ? (
                <Alert variant="info">
                  No hay sucursales asignadas. Selecciona sucursales del listado
                  superior.
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Código</th>
                        <th>Ciudad</th>
                        <th>Gerente</th>
                        <th style={{ width: "60px" }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSelectedBranches().map((branch) => (
                        <tr key={branch._id}>
                          <td>{branch.branchName}</td>
                          <td>{branch.branchCode || "N/A"}</td>
                          <td>
                            {branch.address.city}, {branch.address.state}
                          </td>
                          <td>{branch.manager.name}</td>
                          <td className="text-center">
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 text-danger"
                              onClick={() => handleRemoveBranch(branch._id)}
                              title="Quitar sucursal"
                            >
                              <X size={18} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={saving || loading}
          className="d-flex align-items-center gap-2"
        >
          {saving ? (
            <>
              <Spinner
                animation="border"
                size="sm"
                style={{ width: "16px", height: "16px" }}
              />
              Guardando...
            </>
          ) : (
            <>
              <Save size={18} />
              Guardar
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default BranchesModal;
