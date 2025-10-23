"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Table, Badge, Spinner } from "react-bootstrap";
import { X, Package, Calendar, MapPin, User } from "lucide-react";
import { Storage, Product } from "../types";
import { storageService } from "../services/storage";

interface ViewStorageModalProps {
  show: boolean;
  onHide: () => void;
  storage: Storage | null;
  onStorageUpdated: () => void;
}

const ViewStorageModal: React.FC<ViewStorageModalProps> = ({
  show,
  onHide,
  storage: initialStorage,
  onStorageUpdated,
}) => {
  const [storage, setStorage] = useState<Storage | null>(initialStorage);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (show && initialStorage) {
      loadStorageDetails();
    }
  }, [show, initialStorage]);

  const loadStorageDetails = async () => {
    if (!initialStorage) return;

    try {
      setLoading(true);
      const response = await storageService.getStorageById(initialStorage._id);
      setStorage(response.data);
    } catch (error) {
      console.error("Error loading storage details:", error);
      setStorage(initialStorage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getProductName = (productItem: any) => {
    if (typeof productItem.productId === "string") {
      return productItem.productId;
    }
    return productItem.productId?.nombre || "N/A";
  };

  const getProductUnit = (productItem: any) => {
    if (typeof productItem.productId === "string") {
      return "";
    }
    return productItem.productId?.unidad || "";
  };

  const getBranchName = () => {
    if (!storage) return "";
    if (typeof storage.branch === "string") return storage.branch;
    return storage.branch.branchName;
  };

  const getManagerName = () => {
    if (!storage) return "";
    if (typeof storage.warehouseManager === "string") return storage.warehouseManager;
    return storage.warehouseManager.profile?.fullName || storage.warehouseManager.username;
  };

  const getTotalProducts = () => {
    return storage?.products.length || 0;
  };

  const getTotalQuantity = () => {
    return storage?.products.reduce((sum, item) => sum + item.quantity, 0) || 0;
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header className="border-0 pb-0">
        <div className="w-100">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-1 fw-bold">Detalles del Almacén</h5>
              <p className="text-muted mb-0">{getBranchName()}</p>
            </div>
            <Button variant="link" onClick={onHide} className="text-muted p-0">
              <X size={24} />
            </Button>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="text-muted mt-3">Cargando detalles...</p>
          </div>
        ) : storage ? (
          <>
            {/* Información General */}
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "12px" }}>
              <div className="card-body p-4">
                <h6 className="mb-3 fw-bold">Información General</h6>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-start">
                      <MapPin size={20} className="text-primary me-2 mt-1" />
                      <div>
                        <small className="text-muted d-block">Sucursal</small>
                        <span className="fw-semibold">{getBranchName()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-start">
                      <User size={20} className="text-primary me-2 mt-1" />
                      <div>
                        <small className="text-muted d-block">Gerente de Almacén</small>
                        <span className="fw-semibold">{getManagerName()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-start">
                      <Calendar size={20} className="text-primary me-2 mt-1" />
                      <div>
                        <small className="text-muted d-block">Último Ingreso</small>
                        <span className="fw-semibold">{formatDate(storage.lastIncome)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-start">
                      <Calendar size={20} className="text-primary me-2 mt-1" />
                      <div>
                        <small className="text-muted d-block">Último Egreso</small>
                        <span className="fw-semibold">{formatDate(storage.lastOutcome)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dirección */}
                <div className="mt-3">
                  <small className="text-muted d-block mb-1">Dirección</small>
                  <p className="mb-0">
                    {storage.address.street} #{storage.address.externalNumber}
                    {storage.address.internalNumber ? ` Int. ${storage.address.internalNumber}` : ""}
                    , {storage.address.neighborhood}, {storage.address.city}, {storage.address.state}{" "}
                    C.P. {storage.address.postalCode}
                  </p>
                </div>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="row mb-4">
              <div className="col-md-4">
                <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                  <div className="card-body text-center p-4">
                    <Package size={32} className="text-primary mb-2" />
                    <h4 className="mb-0 fw-bold">{getTotalProducts()}</h4>
                    <small className="text-muted">Productos Diferentes</small>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                  <div className="card-body text-center p-4">
                    <Package size={32} className="text-success mb-2" />
                    <h4 className="mb-0 fw-bold">{getTotalQuantity()}</h4>
                    <small className="text-muted">Cantidad Total</small>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                  <div className="card-body text-center p-4">
                    <Badge
                      bg={storage.isActive ? "success" : "danger"}
                      className="fs-6 px-3 py-2"
                      style={{ borderRadius: "20px" }}
                    >
                      {storage.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                    <div className="mt-2">
                      <small className="text-muted">Estado</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Productos */}
            <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-body p-4">
                <h6 className="mb-3 fw-bold">Productos en Almacén</h6>

                {storage.products.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <Package size={48} className="mb-3 opacity-50" />
                    <p className="mb-0">No hay productos en este almacén</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead style={{ background: "#f8f9fa" }}>
                        <tr>
                          <th className="px-3 py-3 fw-semibold text-muted">#</th>
                          <th className="px-3 py-3 fw-semibold text-muted">PRODUCTO</th>
                          <th className="px-3 py-3 fw-semibold text-muted">UNIDAD</th>
                          <th className="px-3 py-3 fw-semibold text-muted text-end">CANTIDAD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {storage.products.map((item, index) => (
                          <tr key={item._id}>
                            <td className="px-3 py-3">{index + 1}</td>
                            <td className="px-3 py-3 fw-semibold">{getProductName(item)}</td>
                            <td className="px-3 py-3">
                              <Badge bg="secondary">{getProductUnit(item)}</Badge>
                            </td>
                            <td className="px-3 py-3 text-end">
                              <Badge bg="primary" pill className="px-3">
                                {item.quantity}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4 text-muted">
            <p>No hay datos del almacén disponibles</p>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0">
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ViewStorageModal;
