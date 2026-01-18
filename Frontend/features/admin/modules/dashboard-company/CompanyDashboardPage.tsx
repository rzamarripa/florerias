"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Building2 } from "lucide-react";
import { toast } from "react-toastify";
import DateFilters from "./components/DateFilters";
import BranchCard from "./components/BranchCard";
import EmployeesModal from "./components/EmployeesModal";
import SalesModal from "./components/SalesModal";
import ExpensesModal from "./components/ExpensesModal";
import PurchasesModal from "./components/PurchasesModal";
import { companyDashboardService } from "./services/companyDashboard";
import { BranchStats, DateFilters as DateFiltersType, Employee, Sale, Expense, Purchase } from "./types";

const CompanyDashboardPage: React.FC = () => {
  const [branches, setBranches] = useState<BranchStats[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [filters, setFilters] = useState<DateFiltersType>({
    startDate: "",
    endDate: "",
    viewMode: "mes",
  });

  // Modal states
  const [showEmployeesModal, setShowEmployeesModal] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  const [showPurchasesModal, setShowPurchasesModal] = useState(false);

  // Selected branch data
  const [selectedBranch, setSelectedBranch] = useState<BranchStats | null>(null);
  const [modalEmployees, setModalEmployees] = useState<Employee[]>([]);
  const [modalSales, setModalSales] = useState<Sale[]>([]);
  const [modalExpenses, setModalExpenses] = useState<Expense[]>([]);
  const [modalPurchases, setModalPurchases] = useState<Purchase[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const handleSearch = async (searchFilters: DateFiltersType) => {
    try {
      setLoading(true);
      setFilters(searchFilters);

      const response = await companyDashboardService.getBranchesStats(searchFilters);

      if (response.success) {
        setBranches(response.data);
        setHasSearched(true);
      }
    } catch (error: any) {
      console.error("Error al cargar estadísticas:", error);
      toast.error(
        error.response?.data?.message ||
          "Error al cargar las estadísticas de las sucursales"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handlers para abrir modals
  const handleEmployeesClick = (branch: BranchStats) => {
    setSelectedBranch(branch);
    setModalEmployees(branch.employees);
    setShowEmployeesModal(true);
  };

  const handleSalesClick = async (branch: BranchStats) => {
    try {
      setSelectedBranch(branch);
      setShowSalesModal(true);
      setModalLoading(true);

      const response = await companyDashboardService.getBranchSales(
        branch._id,
        filters
      );

      if (response.success) {
        setModalSales(response.data);
      }
    } catch (error: any) {
      console.error("Error al cargar ventas:", error);
      toast.error("Error al cargar las ventas de la sucursal");
    } finally {
      setModalLoading(false);
    }
  };

  const handleExpensesClick = async (branch: BranchStats) => {
    try {
      setSelectedBranch(branch);
      setShowExpensesModal(true);
      setModalLoading(true);

      const response = await companyDashboardService.getBranchExpenses(
        branch._id,
        filters
      );

      if (response.success) {
        setModalExpenses(response.data);
      }
    } catch (error: any) {
      console.error("Error al cargar gastos:", error);
      toast.error("Error al cargar los gastos de la sucursal");
    } finally {
      setModalLoading(false);
    }
  };

  const handlePurchasesClick = async (branch: BranchStats) => {
    try {
      setSelectedBranch(branch);
      setShowPurchasesModal(true);
      setModalLoading(true);

      const response = await companyDashboardService.getBranchPurchases(
        branch._id,
        filters
      );

      if (response.success) {
        setModalPurchases(response.data);
      }
    } catch (error: any) {
      console.error("Error al cargar compras:", error);
      toast.error("Error al cargar las compras de la sucursal");
    } finally {
      setModalLoading(false);
    }
  };

  // Handlers para cerrar modals
  const handleCloseEmployeesModal = () => {
    setShowEmployeesModal(false);
    setSelectedBranch(null);
    setModalEmployees([]);
  };

  const handleCloseSalesModal = () => {
    setShowSalesModal(false);
    setSelectedBranch(null);
    setModalSales([]);
  };

  const handleCloseExpensesModal = () => {
    setShowExpensesModal(false);
    setSelectedBranch(null);
    setModalExpenses([]);
  };

  const handleClosePurchasesModal = () => {
    setShowPurchasesModal(false);
    setSelectedBranch(null);
    setModalPurchases([]);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Empresa</h2>
          <p className="text-muted-foreground">
            Visualiza y gestiona todas tus sucursales
          </p>
        </div>
        <div className="bg-primary text-primary-foreground flex items-center justify-center rounded-full w-12 h-12">
          <Building2 size={28} />
        </div>
      </div>

      {/* Filtros de Fecha */}
      <DateFilters onSearch={handleSearch} />

      {/* Branches Grid */}
      {loading ? (
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-muted-foreground">Cargando estadísticas...</p>
          </div>
        </div>
      ) : hasSearched ? (
        branches.length === 0 ? (
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="p-6 text-center">
              <Building2 size={48} className="text-muted-foreground mb-3 mx-auto" />
              <h5 className="text-muted-foreground font-medium mb-2">No hay sucursales disponibles</h5>
              <p className="text-sm text-muted-foreground">
                No se encontraron sucursales para tu usuario
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h5 className="font-semibold">
                Sucursales ({branches.length})
              </h5>
              <p className="text-sm text-muted-foreground">
                Haz clic en las estadísticas para ver detalles
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branches.map((branch) => (
                <BranchCard
                  key={branch._id}
                  branch={branch}
                  onEmployeesClick={() => handleEmployeesClick(branch)}
                  onSalesClick={() => handleSalesClick(branch)}
                  onExpensesClick={() => handleExpensesClick(branch)}
                  onPurchasesClick={() => handlePurchasesClick(branch)}
                />
              ))}
            </div>
          </div>
        )
      ) : (
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="p-6 text-center">
            <div className="mb-3">
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-muted-foreground mx-auto"
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h5 className="text-muted-foreground font-medium mb-2">
              Los filtros se cargarán automáticamente
            </h5>
            <p className="text-sm text-muted-foreground">
              Espera un momento mientras cargamos las estadísticas del mes actual
            </p>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedBranch && (
        <>
          <EmployeesModal
            show={showEmployeesModal}
            onHide={handleCloseEmployeesModal}
            employees={modalEmployees}
            branchName={selectedBranch.branchName}
          />

          <SalesModal
            show={showSalesModal}
            onHide={handleCloseSalesModal}
            sales={modalSales}
            branchName={selectedBranch.branchName}
            loading={modalLoading}
          />

          <ExpensesModal
            show={showExpensesModal}
            onHide={handleCloseExpensesModal}
            expenses={modalExpenses}
            branchName={selectedBranch.branchName}
            loading={modalLoading}
          />

          <PurchasesModal
            show={showPurchasesModal}
            onHide={handleClosePurchasesModal}
            purchases={modalPurchases}
            branchName={selectedBranch.branchName}
            loading={modalLoading}
          />
        </>
      )}
    </div>
  );
};

export default CompanyDashboardPage;
