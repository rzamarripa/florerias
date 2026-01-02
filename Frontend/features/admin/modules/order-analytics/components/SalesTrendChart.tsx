"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { SalesTrend } from "../types";

interface SalesTrendChartProps {
  data: SalesTrend[];
  previousData?: SalesTrend[];
}

const SalesTrendChart: React.FC<SalesTrendChartProps> = ({
  data,
  previousData,
}) => {
  // Combinar datos actuales y anteriores para el gráfico
  const chartData = data.map((item, index) => {
    // Agregar T12:00:00 para evitar problemas de zona horaria
    const dateStr = item.date.includes("T") ? item.date : `${item.date}T12:00:00`;
    return {
      date: new Date(dateStr).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
      }),
      actual: item.amount,
      anterior: previousData?.[index]?.amount || 0,
    };
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorAnterior" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#93c5fd" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          stroke="#6b7280"
          style={{ fontSize: "12px" }}
          tick={{ fill: "#6b7280" }}
        />
        <YAxis
          stroke="#6b7280"
          style={{ fontSize: "12px" }}
          tick={{ fill: "#6b7280" }}
          tickFormatter={formatCurrency}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
          formatter={(value: number) => [formatCurrency(value), ""]}
          labelStyle={{ color: "#1f2937", fontWeight: "600" }}
        />
        <Legend
          wrapperStyle={{ fontSize: "14px" }}
          iconType="circle"
          formatter={(value) => (value === "actual" ? "Actual" : "Anterior")}
        />
        <Area
          type="monotone"
          dataKey="actual"
          stroke="#3b82f6"
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorActual)"
        />
        {previousData && (
          <Area
            type="monotone"
            dataKey="anterior"
            stroke="#93c5fd"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorAnterior)"
            strokeDasharray="5 5"
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default SalesTrendChart;
