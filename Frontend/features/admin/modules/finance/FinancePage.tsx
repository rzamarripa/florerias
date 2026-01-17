"use client";

import React, { useState, useEffect } from "react";
import FinanceFilters from "./components/FinanceFilters";
import FinanceStats from "./components/FinanceStats";
import IncomeStats from "./components/IncomeStats";
import OrderPaymentsTable from "./components/OrderPaymentsTable";
import DiscountedSalesTable from "./components/DiscountedSalesTable";
import BuysTable from "./components/BuysTable";
import ExpensesTable from "./components/ExpensesTable";
import { FinanceFilters as FinanceFiltersType } from "./types";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";

const FinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("pagos-realizados");
  const [filters, setFilters] = useState<FinanceFiltersType>({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    clientIds: [],
    paymentMethods: [],
  });

  // Carga inicial de datos sin necesidad de hacer clic en buscar
  useEffect(() => {
    // Los datos se cargarán automáticamente con los filtros por defecto
  }, []);

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
  };

  return (
    <div className="container mx-auto py-4 px-4">
      {/* Header */}
      <PageHeader
        title="Finanzas"
        description="Consulta y analiza el estado financiero"
      />

      {/* Filtros */}
      <FinanceFilters onSearch={handleSearch} />

      {/* Totales Generales */}
      <FinanceStats filters={filters} />

      {/* Ingresos */}
      <IncomeStats filters={filters} />

      {/* Tabs para diferentes secciones */}
      <Card className="border-0 shadow-sm rounded-[15px]">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="px-4 pt-3 border-b-2 border-muted">
              <TabsList className="bg-transparent border-0 h-auto p-0 gap-0">
                <TabsTrigger
                  value="pagos-realizados"
                  className="px-4 py-2 font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  Pagos Realizados
                </TabsTrigger>
                <TabsTrigger
                  value="ventas-descuento"
                  className="px-4 py-2 font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  Ventas con Descuento
                </TabsTrigger>
                <TabsTrigger
                  value="compras"
                  className="px-4 py-2 font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  Compras
                </TabsTrigger>
                <TabsTrigger
                  value="gastos"
                  className="px-4 py-2 font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  Gastos
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="pagos-realizados" className="p-4 mt-0">
              <OrderPaymentsTable filters={filters} />
            </TabsContent>

            <TabsContent value="ventas-descuento" className="p-4 mt-0">
              <DiscountedSalesTable filters={filters} />
            </TabsContent>

            <TabsContent value="compras" className="p-4 mt-0">
              <BuysTable filters={filters} />
            </TabsContent>

            <TabsContent value="gastos" className="p-4 mt-0">
              <ExpensesTable filters={filters} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancePage;
