"use client";

import React from "react";
import { BranchStats } from "../types";
import {
  Users,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface BranchCardProps {
  branch: BranchStats;
  onEmployeesClick: () => void;
  onSalesClick: () => void;
  onExpensesClick: () => void;
  onPurchasesClick: () => void;
}

const BranchCard: React.FC<BranchCardProps> = ({
  branch,
  onEmployeesClick,
  onSalesClick,
  onExpensesClick,
  onPurchasesClick,
}) => {
  // Función para formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  // Obtener primeros 8 empleados para mostrar avatares
  const displayEmployees = branch.employees.slice(0, 8);

  // Generar color de fondo para avatar basado en el nombre
  const getAvatarColor = (name: string) => {
    const colors = [
      "#0d6efd",
      "#6610f2",
      "#6f42c1",
      "#d63384",
      "#dc3545",
      "#fd7e14",
      "#ffc107",
      "#198754",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Obtener iniciales del nombre
  const getInitials = (fullName: string) => {
    const names = fullName.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  // Mensaje del porcentaje de completitud
  const getCompletionMessage = () => {
    const percentage = branch.stats.completionPercentage;
    if (percentage === 100) {
      return "Todas las órdenes completadas";
    } else if (percentage >= 75) {
      return `${branch.stats.completedOrders} de ${branch.stats.totalOrders} órdenes completadas`;
    } else if (percentage >= 50) {
      return `${branch.stats.completedOrders} de ${branch.stats.totalOrders} órdenes en progreso`;
    } else if (percentage > 0) {
      return `${branch.stats.totalOrders - branch.stats.completedOrders} órdenes pendientes`;
    } else {
      return "Sin órdenes registradas";
    }
  };

  return (
    <Card className="h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <CardContent className="p-4">
        {/* Header: Branch name y badge */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h5 className="font-bold mb-1">{branch.branchName}</h5>
            <p className="text-muted-foreground text-sm">
              {branch.branchCode}
            </p>
          </div>
          {branch.isActive && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              Activa
            </Badge>
          )}
        </div>

        {/* Manager info */}
        <div className="mb-3">
          <p className="text-muted-foreground text-xs font-semibold mb-2">
            Gerente
          </p>
          <div className="flex items-center gap-2">
            <div
              className="rounded-full flex items-center justify-center text-white font-bold w-10 h-10 text-sm overflow-hidden"
              style={{ background: getAvatarColor(branch.manager.profile.fullName) }}
            >
              {branch.manager.profile.image ? (
                <img
                  src={branch.manager.profile.image}
                  alt={branch.manager.profile.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(branch.manager.profile.fullName)
              )}
            </div>
            <div>
              <p className="font-semibold text-sm">
                {branch.manager.profile.fullName}
              </p>
              <p className="text-muted-foreground text-xs">
                {branch.manager.email}
              </p>
            </div>
          </div>
        </div>

        {/* Employees avatars */}
        <div className="mb-4">
          <p className="text-muted-foreground text-xs font-semibold mb-2">
            Total {branch.employees.length} empleados
          </p>
          <div className="flex items-center">
            {displayEmployees.map((employee, index) => (
              <div
                key={employee._id}
                className="rounded-full flex items-center justify-center text-white font-bold w-9 h-9 text-xs border-2 border-white dark:border-gray-800 overflow-hidden cursor-pointer"
                style={{
                  background: getAvatarColor(employee.profile.fullName),
                  marginLeft: index > 0 ? "-10px" : "0",
                  zIndex: displayEmployees.length - index,
                }}
                title={employee.profile.fullName}
              >
                {employee.profile.image ? (
                  <img
                    src={employee.profile.image}
                    alt={employee.profile.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(employee.profile.fullName)
                )}
              </div>
            ))}
            {branch.employees.length > 8 && (
              <div
                className="rounded-full flex items-center justify-center text-white font-bold w-9 h-9 text-xs border-2 border-white dark:border-gray-800 bg-gray-500"
                style={{ marginLeft: "-10px", zIndex: 0 }}
              >
                +{branch.employees.length - 8}
              </div>
            )}
          </div>
        </div>

        {/* About Team section with stats */}
        <div className="mb-3">
          <p className="text-muted-foreground text-xs font-semibold mb-2">
            Estadísticas
          </p>
          <p className="text-muted-foreground text-sm mb-3">
            {branch.address.city}, {branch.address.state}
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* Empleados */}
          <div
            className="p-3 rounded-lg h-full bg-primary/10 cursor-pointer transition-transform hover:scale-105"
            onClick={onEmployeesClick}
          >
            <div className="flex items-center justify-between mb-2">
              <Users size={20} className="text-primary" />
              <span className="text-[10px] font-semibold tracking-wide bg-primary/25 text-primary px-2 py-1 rounded">
                EMPLEADOS
              </span>
            </div>
            <h4 className="font-bold text-primary text-xl">
              {branch.employees.length}
            </h4>
          </div>

          {/* Ventas */}
          <div
            className="p-3 rounded-lg h-full cursor-pointer transition-transform hover:scale-105"
            style={{ background: "linear-gradient(135deg, #43e97b15 0%, #38f9d715 100%)" }}
            onClick={onSalesClick}
          >
            <div className="flex items-center justify-between mb-2">
              <TrendingUp size={20} style={{ color: "#43e97b" }} />
              <span className="text-[10px] font-semibold tracking-wide px-2 py-1 rounded"
                style={{ color: "#2d9e5a", backgroundColor: "#e8f8ed" }}>
                VENTAS
              </span>
            </div>
            <h6 className="font-bold text-sm" style={{ color: "#43e97b" }}>
              {formatCurrency(branch.stats.totalSales)}
            </h6>
          </div>

          {/* Gastos */}
          <div
            className="p-3 rounded-lg h-full cursor-pointer transition-transform hover:scale-105"
            style={{ background: "linear-gradient(135deg, #fa709a15 0%, #fee14015 100%)" }}
            onClick={onExpensesClick}
          >
            <div className="flex items-center justify-between mb-2">
              <TrendingDown size={20} style={{ color: "#fa709a" }} />
              <span className="text-[10px] font-semibold tracking-wide px-2 py-1 rounded"
                style={{ color: "#d6537a", backgroundColor: "#fef0f4" }}>
                GASTOS
              </span>
            </div>
            <h6 className="font-bold text-sm" style={{ color: "#fa709a" }}>
              {formatCurrency(branch.stats.totalExpenses)}
            </h6>
          </div>

          {/* Compras */}
          <div
            className="p-3 rounded-lg h-full cursor-pointer transition-transform hover:scale-105"
            style={{ background: "linear-gradient(135deg, #4facfe15 0%, #00f2fe15 100%)" }}
            onClick={onPurchasesClick}
          >
            <div className="flex items-center justify-between mb-2">
              <ShoppingCart size={20} style={{ color: "#4facfe" }} />
              <span className="text-[10px] font-semibold tracking-wide px-2 py-1 rounded"
                style={{ color: "#3a8dd6", backgroundColor: "#edf7fe" }}>
                COMPRAS
              </span>
            </div>
            <h6 className="font-bold text-sm" style={{ color: "#4facfe" }}>
              {formatCurrency(branch.stats.totalPurchases)}
            </h6>
          </div>
        </div>

        {/* Cajas activas badge */}
        <div className="mb-3">
          <div
            className="flex items-center justify-center p-2 rounded-lg"
            style={{
              background: branch.stats.activeCashRegisters > 0
                ? "linear-gradient(135deg, #30cfd015 0%, #330d0d15 100%)"
                : "rgb(248 249 250)",
            }}
          >
            <Wallet
              size={18}
              className="mr-2"
              style={{ color: branch.stats.activeCashRegisters > 0 ? "#30cfd0" : "#6c757d" }}
            />
            <span
              className="font-semibold text-sm"
              style={{ color: branch.stats.activeCashRegisters > 0 ? "#30cfd0" : "#6c757d" }}
            >
              {branch.stats.activeCashRegisters} {branch.stats.activeCashRegisters === 1 ? "Caja activa" : "Cajas activas"}
            </span>
          </div>
        </div>

        {/* Status bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-muted-foreground text-xs font-semibold">
              Estado de órdenes
            </span>
            <span className="font-bold text-primary text-sm">
              {branch.stats.completionPercentage}%
            </span>
          </div>
          <Progress value={branch.stats.completionPercentage} className="h-2" />
          <p className="text-muted-foreground text-xs mt-2">
            {getCompletionMessage()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BranchCard;
