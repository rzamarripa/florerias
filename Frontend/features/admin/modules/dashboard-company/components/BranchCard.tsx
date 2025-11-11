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
      "#667eea",
      "#764ba2",
      "#f093fb",
      "#4facfe",
      "#43e97b",
      "#fa709a",
      "#fee140",
      "#30cfd0",
    ];
    const index =
      name.charCodeAt(0) % colors.length;
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
    <div
      className="card border-0 shadow-sm h-100"
      style={{
        borderRadius: "15px",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
      }}
    >
      <div className="card-body p-4">
        {/* Header: Branch name y badge */}
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h5 className="mb-1 fw-bold">{branch.branchName}</h5>
            <p className="text-muted mb-0" style={{ fontSize: "13px" }}>
              {branch.branchCode}
            </p>
          </div>
          {branch.isActive && (
            <span
              className="badge"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "11px",
                fontWeight: "600",
              }}
            >
              Activa
            </span>
          )}
        </div>

        {/* Manager info */}
        <div className="mb-3">
          <p
            className="text-muted mb-2"
            style={{ fontSize: "12px", fontWeight: "600" }}
          >
            Gerente
          </p>
          <div className="d-flex align-items-center">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold me-2"
              style={{
                width: "40px",
                height: "40px",
                background: getAvatarColor(branch.manager.profile.fullName),
                fontSize: "14px",
              }}
            >
              {branch.manager.profile.image ? (
                <img
                  src={branch.manager.profile.image}
                  alt={branch.manager.profile.fullName}
                  className="rounded-circle"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                getInitials(branch.manager.profile.fullName)
              )}
            </div>
            <div>
              <p className="mb-0 fw-semibold" style={{ fontSize: "14px" }}>
                {branch.manager.profile.fullName}
              </p>
              <p
                className="mb-0 text-muted"
                style={{ fontSize: "12px" }}
              >
                {branch.manager.email}
              </p>
            </div>
          </div>
        </div>

        {/* Employees avatars */}
        <div className="mb-4">
          <p
            className="text-muted mb-2"
            style={{ fontSize: "12px", fontWeight: "600" }}
          >
            Total {branch.employees.length} empleados
          </p>
          <div className="d-flex align-items-center">
            {displayEmployees.map((employee, index) => (
              <div
                key={employee._id}
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold border border-2 border-white"
                style={{
                  width: "36px",
                  height: "36px",
                  background: getAvatarColor(employee.profile.fullName),
                  fontSize: "12px",
                  marginLeft: index > 0 ? "-10px" : "0",
                  zIndex: displayEmployees.length - index,
                  cursor: "pointer",
                }}
                title={employee.profile.fullName}
              >
                {employee.profile.image ? (
                  <img
                    src={employee.profile.image}
                    alt={employee.profile.fullName}
                    className="rounded-circle"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  getInitials(employee.profile.fullName)
                )}
              </div>
            ))}
            {branch.employees.length > 8 && (
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold border border-2 border-white"
                style={{
                  width: "36px",
                  height: "36px",
                  background: "#6c757d",
                  fontSize: "11px",
                  marginLeft: "-10px",
                  zIndex: 0,
                }}
              >
                +{branch.employees.length - 8}
              </div>
            )}
          </div>
        </div>

        {/* About Team section with stats */}
        <div className="mb-3">
          <p
            className="text-muted mb-2"
            style={{ fontSize: "12px", fontWeight: "600" }}
          >
            Estadísticas
          </p>
          <p className="text-muted mb-3" style={{ fontSize: "13px" }}>
            {branch.address.city}, {branch.address.state}
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="row g-2 mb-3">
          {/* Empleados */}
          <div className="col-6">
            <div
              className="p-3 rounded-3 h-100"
              style={{
                background: "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
                cursor: "pointer",
                transition: "transform 0.2s",
              }}
              onClick={onEmployeesClick}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <div className="d-flex align-items-center justify-content-between mb-2">
                <Users size={20} style={{ color: "#667eea" }} />
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: "600",
                    color: "#667eea",
                    backgroundColor: "#ededf8",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    letterSpacing: "0.5px"
                  }}
                >
                  EMPLEADOS
                </span>
              </div>
              <h4 className="mb-0 fw-bold" style={{ color: "#667eea" }}>
                {branch.employees.length}
              </h4>
            </div>
          </div>

          {/* Ventas */}
          <div className="col-6">
            <div
              className="p-3 rounded-3 h-100"
              style={{
                background: "linear-gradient(135deg, #43e97b15 0%, #38f9d715 100%)",
                cursor: "pointer",
                transition: "transform 0.2s",
              }}
              onClick={onSalesClick}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <div className="d-flex align-items-center justify-content-between mb-2">
                <TrendingUp size={20} style={{ color: "#43e97b" }} />
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: "600",
                    color: "#2d9e5a",
                    backgroundColor: "#e8f8ed",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    letterSpacing: "0.5px"
                  }}
                >
                  VENTAS
                </span>
              </div>
              <h6 className="mb-0 fw-bold" style={{ color: "#43e97b", fontSize: "14px" }}>
                {formatCurrency(branch.stats.totalSales)}
              </h6>
            </div>
          </div>

          {/* Gastos */}
          <div className="col-6">
            <div
              className="p-3 rounded-3 h-100"
              style={{
                background: "linear-gradient(135deg, #fa709a15 0%, #fee14015 100%)",
                cursor: "pointer",
                transition: "transform 0.2s",
              }}
              onClick={onExpensesClick}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <div className="d-flex align-items-center justify-content-between mb-2">
                <TrendingDown size={20} style={{ color: "#fa709a" }} />
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: "600",
                    color: "#d6537a",
                    backgroundColor: "#fef0f4",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    letterSpacing: "0.5px"
                  }}
                >
                  GASTOS
                </span>
              </div>
              <h6 className="mb-0 fw-bold" style={{ color: "#fa709a", fontSize: "14px" }}>
                {formatCurrency(branch.stats.totalExpenses)}
              </h6>
            </div>
          </div>

          {/* Compras */}
          <div className="col-6">
            <div
              className="p-3 rounded-3 h-100"
              style={{
                background: "linear-gradient(135deg, #4facfe15 0%, #00f2fe15 100%)",
                cursor: "pointer",
                transition: "transform 0.2s",
              }}
              onClick={onPurchasesClick}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <div className="d-flex align-items-center justify-content-between mb-2">
                <ShoppingCart size={20} style={{ color: "#4facfe" }} />
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: "600",
                    color: "#3a8dd6",
                    backgroundColor: "#edf7fe",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    letterSpacing: "0.5px"
                  }}
                >
                  COMPRAS
                </span>
              </div>
              <h6 className="mb-0 fw-bold" style={{ color: "#4facfe", fontSize: "14px" }}>
                {formatCurrency(branch.stats.totalPurchases)}
              </h6>
            </div>
          </div>
        </div>

        {/* Cajas activas badge */}
        <div className="mb-3">
          <div
            className="d-flex align-items-center justify-content-center p-2 rounded-3"
            style={{
              background: branch.stats.activeCashRegisters > 0
                ? "linear-gradient(135deg, #30cfd015 0%, #330d0d15 100%)"
                : "#f8f9fa",
            }}
          >
            <Wallet
              size={18}
              className="me-2"
              style={{ color: branch.stats.activeCashRegisters > 0 ? "#30cfd0" : "#6c757d" }}
            />
            <span
              className="fw-semibold"
              style={{
                fontSize: "13px",
                color: branch.stats.activeCashRegisters > 0 ? "#30cfd0" : "#6c757d"
              }}
            >
              {branch.stats.activeCashRegisters} {branch.stats.activeCashRegisters === 1 ? "Caja activa" : "Cajas activas"}
            </span>
          </div>
        </div>

        {/* Status bar */}
        <div>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span
              className="text-muted"
              style={{ fontSize: "12px", fontWeight: "600" }}
            >
              Estado de órdenes
            </span>
            <span className="fw-bold" style={{ fontSize: "14px", color: "#667eea" }}>
              {branch.stats.completionPercentage}%
            </span>
          </div>
          <div
            className="progress"
            style={{ height: "8px", borderRadius: "10px", background: "#e9ecef" }}
          >
            <div
              className="progress-bar"
              role="progressbar"
              style={{
                width: `${branch.stats.completionPercentage}%`,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: "10px",
              }}
              aria-valuenow={branch.stats.completionPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="text-muted mt-2 mb-0" style={{ fontSize: "12px" }}>
            {getCompletionMessage()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BranchCard;
