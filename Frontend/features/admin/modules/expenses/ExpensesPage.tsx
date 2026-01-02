"use client";

import React, { useState } from "react";
import { Tabs, Tab, Button } from "react-bootstrap";
import { Plus } from "lucide-react";
import CheckTransferTable from "./components/CheckTransferTable";
import PettyCashTable from "./components/PettyCashTable";
import ExpenseModal from "./components/ExpenseModal";
import { Expense } from "./types";

const ExpensesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("check_transfer");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const handleOpenModal = (expense?: Expense) => {
    setSelectedExpense(expense || null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedExpense(null);
  };

  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="container-fluid py-2">
      {/* Header */}
      <div className="mb-2">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h2 className="mb-1 fw-bold">Gastos</h2>
            <p className="text-muted mb-0">
              Gestiona los gastos de tu sucursal
            </p>
          </div>

          {/* Botón de nuevo gasto */}
          <Button
            variant="primary"
            onClick={() => handleOpenModal()}
            className="d-flex align-items-center gap-2"
          >
            <Plus size={18} />
            Nuevo Gasto
          </Button>
        </div>
      </div>

      {/* Tabs con Tablas */}
      <div
        className="card border-0 shadow-sm"
        style={{ borderRadius: "10px" }}
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
              onSelect={(k) => setActiveTab(k || "check_transfer")}
              className="border-0"
            >
              <Tab
                eventKey="check_transfer"
                title={
                  <span className="px-3 py-2 fw-semibold">
                    Cheque / Transferencia
                  </span>
                }
              >
                <div className="p-4">
                  <CheckTransferTable
                    onEdit={handleOpenModal}
                    refreshTrigger={refreshTrigger}
                  />
                </div>
              </Tab>

              <Tab
                eventKey="petty_cash"
                title={
                  <span className="px-3 py-2 fw-semibold">Caja Chica</span>
                }
              >
                <div className="p-4">
                  <PettyCashTable
                    onEdit={handleOpenModal}
                    refreshTrigger={refreshTrigger}
                  />
                </div>
              </Tab>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Modal de Creación/Edición */}
      <ExpenseModal
        show={showModal}
        onHide={handleCloseModal}
        onSuccess={handleSuccess}
        expense={selectedExpense}
      />
    </div>
  );
};

export default ExpensesPage;
