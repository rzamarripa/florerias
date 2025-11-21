"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import { storageService } from "../services/storage";
import { branchesService } from "../../branches/services/branches";
import { Branch } from "../../branches/types";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useUserRoleStore } from "@/stores/userRoleStore";

interface CreateStorageModalProps {
  show: boolean;
  onHide: () => void;
  onStorageSaved: () => void;
  branches?: Branch[];
}

const CreateStorageModal: React.FC<CreateStorageModalProps> = ({
  show,
  onHide,
  onStorageSaved,
  branches: propBranches,
}) => {
  const { activeBranch } = useActiveBranchStore();
  const { getIsAdmin, hasRole } = useUserRoleStore();
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [storageName, setStorageName] = useState<string>("");
  const [storageExists, setStorageExists] = useState<boolean>(false);
  const [checkingStorage, setCheckingStorage] = useState<boolean>(false);

  const isAdmin = getIsAdmin();
  const isManager = hasRole("Gerente");
  const isCashier = hasRole("Cajero");

  useEffect(() => {
    if (show) {
      loadData();
      // Si hay una sucursal activa, establecerla automáticamente
      if (activeBranch?._id) {
        setSelectedBranch(activeBranch._id);
      }
    }
  }, [show, activeBranch]);

  // Verificar si existe almacén cuando se selecciona una sucursal (para Gerente/Cajero)
  useEffect(() => {
    if (show && (isManager || isCashier) && propBranches && propBranches.length > 0) {
      const userBranchId = propBranches[0]._id;
      checkIfStorageExists(userBranchId);
    }
  }, [show, isManager, isCashier, propBranches]);

  const loadData = async () => {
    try {
      setLoadingData(true);

      // Solo cargar sucursales si es admin
      if (isAdmin) {
        if (!propBranches) {
          const branchesResponse = await branchesService.getAllBranches({
            limit: 100,
          });
          setBranches(branchesResponse.data);
        } else {
          setBranches(propBranches);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar datos");
      console.error("Error loading data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const checkIfStorageExists = async (branchId: string) => {
    try {
      setCheckingStorage(true);
      const response = await storageService.checkStorageExists(branchId);
      setStorageExists(response.exists);
    } catch (error: any) {
      console.error("Error checking storage:", error);
      setStorageExists(false);
    } finally {
      setCheckingStorage(false);
    }
  };

  const validateForm = (): boolean => {
    // Validar nombre del almacén
    if (!storageName || storageName.trim() === "") {
      toast.error("El nombre del almacén es requerido");
      return false;
    }

    // Validar sucursal solo para administradores
    if (isAdmin && !selectedBranch) {
      toast.error("Debes seleccionar una sucursal");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Preparar datos para enviar al backend
      const storageData: any = {
        name: storageName.trim(),
      };

      // Solo incluir branch si es admin
      if (isAdmin) {
        storageData.branch = selectedBranch;
      }

      await storageService.createStorage(storageData);

      toast.success("Almacén creado exitosamente");
      onStorageSaved();
      handleClose();
    } catch (error: any) {
      toast.error(error.message || "Error al crear almacén");
      console.error("Error creating storage:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedBranch("");
    setStorageName("");
    setStorageExists(false);
    setCheckingStorage(false);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered scrollable>
      <Modal.Header className="border-0 pb-0">
        <div className="w-100">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold">Crear Nuevo Almacén</h5>
            <Button
              variant="link"
              onClick={handleClose}
              className="text-muted p-0"
            >
              <X size={24} />
            </Button>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body>
        {loadingData ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="text-muted mt-2">Cargando datos...</p>
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
            {/* Información del Almacén */}
            <div className="mb-4">
              <h6 className="mb-3 fw-bold text-primary">
                Información del Almacén
              </h6>

              {/* Nombre del Almacén */}
              <Form.Group className="mb-3">
                <Form.Label>
                  Nombre del Almacén <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ej: Almacén Principal"
                  value={storageName}
                  onChange={(e) => setStorageName(e.target.value)}
                  required
                />
                <Form.Text className="text-muted">
                  Ingresa un nombre descriptivo para el almacén
                </Form.Text>
              </Form.Group>

              {/* Sucursal - Solo para Administradores */}
              {isAdmin && (
                <Form.Group className="mb-3">
                  <Form.Label>
                    Sucursal <span className="text-danger">*</span>
                  </Form.Label>
                  {activeBranch ? (
                    <>
                      <Form.Control
                        type="text"
                        value={`${activeBranch.branchName} ${
                          activeBranch.branchCode
                            ? `(${activeBranch.branchCode})`
                            : ""
                        }`}
                        readOnly
                        className="bg-light"
                      />
                      <Form.Text className="text-muted">
                        Sucursal seleccionada automáticamente
                      </Form.Text>
                    </>
                  ) : (
                    <Form.Select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      required
                    >
                      <option value="">Seleccionar sucursal...</option>
                      {branches.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.branchName}{" "}
                          {branch.branchCode ? `(${branch.branchCode})` : ""}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                </Form.Group>
              )}

              {/* Mensaje informativo para Gerentes */}
              {isManager && !storageExists && (
                <div className="alert alert-info" role="alert">
                  <small>
                    El almacén se creará automáticamente para tu sucursal
                    asignada.
                  </small>
                </div>
              )}

              {/* Mensaje informativo para Cajeros */}
              {isCashier && !storageExists && (
                <div className="alert alert-info" role="alert">
                  <small>
                    El almacén se creará automáticamente para tu sucursal
                    asignada.
                  </small>
                </div>
              )}

              {/* Alerta cuando ya existe almacén */}
              {(isManager || isCashier) && storageExists && (
                <div className="alert alert-warning" role="alert">
                  <strong>Atención:</strong> Ya existe un almacén para tu sucursal.
                  Cada sucursal solo puede tener un almacén.
                </div>
              )}
            </div>
          </Form>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0">
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={loading || loadingData || ((isManager || isCashier) && storageExists)}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Creando...
            </>
          ) : (
            "Crear Almacén"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateStorageModal;
