"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
        <div className="flex justify-between items-start">
          <div>
            <h2 className="mb-1 font-bold text-2xl">Gastos</h2>
            <p className="text-muted-foreground mb-0">
              Gestiona los gastos de tu sucursal
            </p>
          </div>

          {/* Boton de nuevo gasto */}
          <Button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2"
          >
            <Plus size={18} />
            Nuevo Gasto
          </Button>
        </div>
      </div>

      {/* Tabs con Tablas */}
      <Card className="border-0 shadow-sm rounded-[10px]">
        <CardContent className="p-0">
          {/* Header con pestanas */}
          <div className="px-4 pt-3 border-b-2 border-gray-100">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value)}
            >
              <TabsList className="bg-transparent border-0 h-auto p-0 gap-0">
                <TabsTrigger
                  value="check_transfer"
                  className="px-3 py-2 font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none"
                >
                  Cheque / Transferencia
                </TabsTrigger>
                <TabsTrigger
                  value="petty_cash"
                  className="px-3 py-2 font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none"
                >
                  Caja Chica
                </TabsTrigger>
              </TabsList>

              <TabsContent value="check_transfer" className="p-4">
                <CheckTransferTable
                  onEdit={handleOpenModal}
                  refreshTrigger={refreshTrigger}
                />
              </TabsContent>

              <TabsContent value="petty_cash" className="p-4">
                <PettyCashTable
                  onEdit={handleOpenModal}
                  refreshTrigger={refreshTrigger}
                />
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Creacion/Edicion */}
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
