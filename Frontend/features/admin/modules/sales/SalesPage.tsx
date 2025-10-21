"use client";

import React, { useState, useEffect } from "react";
import { Tabs, Tab } from "react-bootstrap";
import DateFilters from "./components/DateFilters";
import SalesStats from "./components/SalesStats";
import NewSalesTable from "./components/NewSalesTable";
import CreditSalesTable from "./components/CreditSalesTable";
import ExchangeSalesTable from "./components/ExchangeSalesTable";
import CancelledSalesTable from "./components/CancelledSalesTable";
import PendingPaymentsTable from "./components/PendingPaymentsTable";
import { paymentMethodsService } from "../payment-methods/services/paymentMethods";

const SalesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("nuevas");
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [dateFilters, setDateFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    viewMode: "dia" as "dia" | "semana" | "mes",
    branchId: undefined as string | undefined,
  });
  const [creditPaymentMethodId, setCreditPaymentMethodId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        const response = await paymentMethodsService.getAllPaymentMethods({ status: true });
        if (response.data) {
          // Buscar el método de pago "Tarjeta de Crédito" (o variantes)
          const creditMethod = response.data.find(
            (pm) =>
              pm.name.toLowerCase().includes("crédito") ||
              pm.name.toLowerCase().includes("credito") ||
              pm.name.toLowerCase().includes("tarjeta de crédito") ||
              pm.name.toLowerCase().includes("tarjeta de credito")
          );
          if (creditMethod) {
            setCreditPaymentMethodId(creditMethod._id);
          }
        }
      } catch (error) {
        console.error("Error loading payment methods:", error);
      }
    };

    loadPaymentMethods();
  }, []);

  const handleSearch = (filters: {
    startDate: string;
    endDate: string;
    viewMode: "dia" | "semana" | "mes";
    branchId?: string;
  }) => {
    setDateFilters({
      ...filters,
      branchId: filters.branchId || undefined,
    });
    setHasSearched(true);
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="mb-1 fw-bold">Listado de Ventas</h2>
        <p className="text-muted mb-0">Gestiona y consulta todas las ventas</p>
      </div>

      {/* Filtros de Fecha */}
      <DateFilters onSearch={handleSearch} />

      {/* Estadísticas de Ventas - Solo se muestran después de hacer una búsqueda */}
      {hasSearched && <SalesStats filters={dateFilters} />}

      {/* Tabs - Solo se muestran después de hacer una búsqueda */}
      {hasSearched ? (
        <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
          <div className="card-body p-0">
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k || "nuevas")}
              className="border-0 px-4 pt-3"
              style={{
                borderBottom: "2px solid #f1f3f5",
              }}
            >
              <Tab
                eventKey="nuevas"
                title={
                  <span className="px-3 py-2 fw-semibold">Nuevas Ventas</span>
                }
              >
                <div className="p-4">
                  <NewSalesTable filters={dateFilters} />
                </div>
              </Tab>

              <Tab
                eventKey="credito"
                title={
                  <span className="px-3 py-2 fw-semibold">Ventas a Crédito</span>
                }
              >
                <div className="p-4">
                  <CreditSalesTable filters={dateFilters} creditPaymentMethodId={creditPaymentMethodId} />
                </div>
              </Tab>

              <Tab
                eventKey="intercambio"
                title={
                  <span className="px-3 py-2 fw-semibold">Ventas de Intercambio</span>
                }
              >
                <div className="p-4">
                  <ExchangeSalesTable filters={dateFilters} />
                </div>
              </Tab>

              <Tab
                eventKey="canceladas"
                title={
                  <span className="px-3 py-2 fw-semibold">Ventas Canceladas</span>
                }
              >
                <div className="p-4">
                  <CancelledSalesTable filters={dateFilters} />
                </div>
              </Tab>

              <Tab
                eventKey="pendientes"
                title={
                  <span className="px-3 py-2 fw-semibold">Pendientes de Pago</span>
                }
              >
                <div className="p-4">
                  <PendingPaymentsTable filters={dateFilters} />
                </div>
              </Tab>
            </Tabs>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
          <div className="card-body p-5 text-center">
            <div className="mb-3">
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-muted"
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h5 className="text-muted mb-2">Selecciona los filtros y presiona "Buscar"</h5>
            <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
              Usa los filtros de fecha y sucursal para ver las ventas
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPage;
