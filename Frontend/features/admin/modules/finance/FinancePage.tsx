"use client";

import React, { useState } from "react";
import { Tabs, Tab } from "react-bootstrap";
import FinanceFilters from "./components/FinanceFilters";
import FinanceStats from "./components/FinanceStats";
import IncomeStats from "./components/IncomeStats";
import OrderPaymentsTable from "./components/OrderPaymentsTable";
import DiscountedSalesTable from "./components/DiscountedSalesTable";
import BuysTable from "./components/BuysTable";
import ExpensesTable from "./components/ExpensesTable";
import { FinanceFilters as FinanceFiltersType } from "./types";

const FinancePage: React.FC = () => {
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("pagos-realizados");
  const [filters, setFilters] = useState<FinanceFiltersType>({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    clientIds: [],
    paymentMethods: [],
  });

  const handleSearch = (searchFilters: {
    startDate: string;
    endDate: string;
    clientIds?: string[];
    paymentMethods?: string[];
    branchId?: string;
    cashierId?: string;
  }) => {
    setFilters({
      startDate: searchFilters.startDate,
      endDate: searchFilters.endDate,
      clientIds: searchFilters.clientIds || [],
      paymentMethods: searchFilters.paymentMethods || [],
      branchId: searchFilters.branchId,
      cashierId: searchFilters.cashierId,
    });
    setHasSearched(true);
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h2 className="mb-1 fw-bold">Finanzas</h2>
            <p className="text-muted mb-0">
              Consulta y analiza el estado financiero
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <FinanceFilters onSearch={handleSearch} />

      {/* Contenido - Solo se muestra después de hacer una búsqueda */}
      {hasSearched ? (
        <>
          {/* Totales Generales */}
          <FinanceStats filters={filters} />

          {/* Ingresos */}
          <IncomeStats filters={filters} />

          {/* Tabs para diferentes secciones */}
          <div
            className="card border-0 shadow-sm"
            style={{ borderRadius: "15px" }}
          >
            <div className="card-body p-0">
              {/* Header con pestañas */}
              <div
                className="px-4 pt-3"
                style={{
                  borderBottom: "2px solid #f1f3f5",
                }}
              >
                <Tabs
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k || "pagos-realizados")}
                  className="border-0"
                >
                  <Tab
                    eventKey="pagos-realizados"
                    title={
                      <span className="px-3 py-2 fw-semibold">
                        Pagos Realizados
                      </span>
                    }
                  >
                    <div className="p-4">
                      <OrderPaymentsTable filters={filters} />
                    </div>
                  </Tab>

                  <Tab
                    eventKey="ventas-descuento"
                    title={
                      <span className="px-3 py-2 fw-semibold">
                        Ventas con Descuento
                      </span>
                    }
                  >
                    <div className="p-4">
                      <DiscountedSalesTable filters={filters} />
                    </div>
                  </Tab>

                  <Tab
                    eventKey="compras"
                    title={
                      <span className="px-3 py-2 fw-semibold">Compras</span>
                    }
                  >
                    <div className="p-4">
                      <BuysTable filters={filters} />
                    </div>
                  </Tab>

                  <Tab
                    eventKey="gastos"
                    title={
                      <span className="px-3 py-2 fw-semibold">Gastos</span>
                    }
                  >
                    <div className="p-4">
                      <ExpensesTable filters={filters} />
                    </div>
                  </Tab>
                </Tabs>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div
          className="card border-0 shadow-sm"
          style={{ borderRadius: "15px" }}
        >
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
            <h5 className="text-muted mb-2">
              Selecciona los filtros y presiona "Calcular"
            </h5>
            <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
              Usa los filtros para ver el estado financiero
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancePage;
