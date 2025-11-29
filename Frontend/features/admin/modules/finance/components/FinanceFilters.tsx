"use client";

import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col, Card, Alert } from "react-bootstrap";
import { Search } from "lucide-react";
import Select from "react-select";
import { clientsService } from "../../clients/services/clients";
import { paymentMethodsService } from "../../payment-methods/services/paymentMethods";
import { branchesService } from "../../branches/services/branches";
import { Client } from "../../clients/types";
import { PaymentMethod } from "../types";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useUserRoleStore } from "@/stores/userRoleStore";

interface FinanceFiltersProps {
  onSearch: (filters: {
    startDate: string;
    endDate: string;
    clientIds?: string[];
    paymentMethods?: string[];
    branchId?: string;
    cashierId?: string;
  }) => void;
}

const FinanceFilters: React.FC<FinanceFiltersProps> = ({ onSearch }) => {
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [clients, setClients] = useState<Client[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [cashiers, setCashiers] = useState<any[]>([]);
  const [selectedClients, setSelectedClients] = useState<any[]>([]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<any[]>(
    []
  );
  const [branchId, setBranchId] = useState<string>("");
  const [cashierId, setCashierId] = useState<string>("");
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingCashiers, setLoadingCashiers] = useState(false);

  const { activeBranch } = useActiveBranchStore();
  const { hasRole } = useUserRoleStore();
  const isAdmin = hasRole("Administrador") || hasRole("Admin");

  useEffect(() => {
    loadClients();
    loadPaymentMethods();
    // Solo cargar sucursales si NO es administrador
    if (!isAdmin) {
      loadUserBranches();
    }
  }, [isAdmin]);

  // Si es administrador con sucursal activa, usarla automáticamente
  useEffect(() => {
    if (isAdmin && activeBranch) {
      setBranchId(activeBranch._id);
    } else if (isAdmin && !activeBranch) {
      setBranchId(""); // Sin sucursal
    }
  }, [isAdmin, activeBranch]);

  // Cargar cajeros cuando se selecciona una sucursal
  useEffect(() => {
    if (branchId) {
      loadCashiers(branchId);
    } else {
      setCashiers([]);
      setCashierId("");
    }
  }, [branchId]);

  const loadClients = async () => {
    try {
      const response = await clientsService.getAllClients({
        page: 1,
        limit: 1000,
        status: true,
      });
      if (response.data) {
        setClients(response.data);
      }
    } catch (error) {
      console.error("Error loading clients:", error);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const response = await paymentMethodsService.getAllPaymentMethods({
        status: true,
      });
      if (response.data) {
        setPaymentMethods(response.data);
      }
    } catch (error) {
      console.error("Error loading payment methods:", error);
    }
  };

  const loadUserBranches = async () => {
    try {
      setLoadingBranches(true);
      const response = await branchesService.getUserBranches();
      if (response.success) {
        setBranches(response.data);
        // Si solo hay una sucursal, seleccionarla automáticamente
        if (response.data.length === 1) {
          setBranchId(response.data[0]._id);
        }
      }
    } catch (error) {
      console.error("Error loading branches:", error);
    } finally {
      setLoadingBranches(false);
    }
  };

  const loadCashiers = async (selectedBranchId: string) => {
    try {
      setLoadingCashiers(true);
      const response = await branchesService.getCashiersByBranch(selectedBranchId);
      if (response.success) {
        setCashiers(response.data);
      }
    } catch (error) {
      console.error("Error loading cashiers:", error);
      setCashiers([]);
    } finally {
      setLoadingCashiers(false);
    }
  };

  const handleSearch = () => {
    // El backend resolverá automáticamente las sucursales según el rol
    // Si branchId está vacío, el backend buscará en todas las sucursales de la empresa del admin
    onSearch({
      startDate,
      endDate,
      clientIds: selectedClients.map((client) => client.value),
      paymentMethods: selectedPaymentMethods.map((method) => method.value),
      branchId: branchId || undefined,
      cashierId: cashierId || undefined,
    });
  };

  const clientOptions = clients.map((client) => ({
    value: client._id,
    label: `${client.name} ${client.lastName}`,
  }));

  const paymentMethodOptions = paymentMethods.map((method) => ({
    value: method._id,
    label: method.name,
  }));

  const customStyles = {
    control: (base: any) => ({
      ...base,
      minHeight: "42px",
      borderRadius: "10px",
      borderColor: "#dee2e6",
      "&:hover": {
        borderColor: "var(--bs-primary)",
      },
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: "var(--bs-primary-bg-subtle)",
      borderRadius: "6px",
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: "var(--bs-primary)",
      fontWeight: "500",
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: "var(--bs-primary)",
      "&:hover": {
        backgroundColor: "var(--bs-primary)",
        color: "white",
      },
    }),
  };

  return (
    <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: "15px" }}>
      <Card.Body className="p-3">
        <Row className="g-3">
          <Col md={3}>
            <Form.Group>
              <Form.Label className="fw-semibold text-muted small">
                Fecha Inicial *
              </Form.Label>
              <Form.Control
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  borderRadius: "10px",
                  border: "1px solid #dee2e6",
                  padding: "10px 14px",
                }}
              />
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group>
              <Form.Label className="fw-semibold text-muted small">
                Fecha Final *
              </Form.Label>
              <Form.Control
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  borderRadius: "10px",
                  border: "1px solid #dee2e6",
                  padding: "10px 14px",
                }}
              />
            </Form.Group>
          </Col>

          {isAdmin && activeBranch ? (
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold text-muted small">
                  Sucursal *
                </Form.Label>
                <Form.Control
                  type="text"
                  value={activeBranch.branchName}
                  disabled
                  readOnly
                  style={{
                    borderRadius: "10px",
                    border: "1px solid #dee2e6",
                    padding: "10px 14px",
                    backgroundColor: "#f8f9fa",
                  }}
                />
              </Form.Group>
            </Col>
          ) : isAdmin && !activeBranch ? (
            <Col md={3}>
              <Alert variant="warning" className="mb-0 p-2 small">
                <strong>Sin sucursal:</strong> Los resultados incluirán todas las sucursales
              </Alert>
            </Col>
          ) : (
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold text-muted small">
                  Sucursal *
                </Form.Label>
                <Form.Select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  style={{
                    borderRadius: "10px",
                    border: "1px solid #dee2e6",
                    padding: "10px 14px",
                  }}
                  disabled={loadingBranches}
                >
                  <option value="">
                    {branches.length > 1
                      ? "Selecciona una sucursal"
                      : "Cargando..."}
                  </option>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.branchName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          )}

          {(isAdmin && activeBranch) || !isAdmin ? (
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold text-muted small">
                  Cajero
                </Form.Label>
                <Form.Select
                  value={cashierId}
                  onChange={(e) => setCashierId(e.target.value)}
                  style={{
                    borderRadius: "10px",
                    border: "1px solid #dee2e6",
                    padding: "10px 14px",
                  }}
                  disabled={!branchId || loadingCashiers}
                >
                  <option value="">
                    {!branchId
                      ? "Selecciona una sucursal primero"
                      : loadingCashiers
                      ? "Cargando cajeros..."
                      : "Todos los cajeros"}
                  </option>
                  {cashiers.map((cashier) => (
                    <option key={cashier._id} value={cashier._id}>
                      {cashier.profile?.fullName || `${cashier.profile?.name} ${cashier.profile?.lastName}`}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          ) : null}

          <Col md={3}>
            <Form.Group>
              <Form.Label className="fw-semibold text-muted small">
                Cliente
              </Form.Label>
              <Select
                isMulti
                options={clientOptions}
                value={selectedClients}
                onChange={(selected) => setSelectedClients(selected as any[])}
                placeholder="Selecciona cliente(s)"
                styles={customStyles}
                noOptionsMessage={() => "No hay clientes disponibles"}
              />
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group>
              <Form.Label className="fw-semibold text-muted small">
                Forma de Pago
              </Form.Label>
              <Select
                isMulti
                options={paymentMethodOptions}
                value={selectedPaymentMethods}
                onChange={(selected) =>
                  setSelectedPaymentMethods(selected as any[])
                }
                placeholder="Selecciona método(s)"
                styles={customStyles}
                noOptionsMessage={() => "No hay métodos disponibles"}
              />
            </Form.Group>
          </Col>

          <Col xs={12} className="d-flex justify-content-end mt-3">
            <Button
              variant="primary"
              onClick={handleSearch}
              className="d-flex align-items-center gap-2 px-4"
              style={{
                borderRadius: "10px",
                padding: "12px 32px",
                fontWeight: "600",
              }}
            >
              <Search size={18} />
              Calcular
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default FinanceFilters;
