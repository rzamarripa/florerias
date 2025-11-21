"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { SalesByDayOfWeek } from "../types";

interface SalesByDayChartProps {
  data: SalesByDayOfWeek[];
}

const DAYS_MAP: Record<string, string> = {
  monday: "Lun",
  tuesday: "Mar",
  wednesday: "Mié",
  thursday: "Jue",
  friday: "Vie",
  saturday: "Sáb",
  sunday: "Dom",
};

const SalesByDayChart: React.FC<SalesByDayChartProps> = ({ data }) => {
  const chartData = data.map((item) => ({
    day: DAYS_MAP[item.day.toLowerCase()] || item.day,
    ventas: item.count,
    monto: item.amount,
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Encontrar el día con más ventas
  const maxSales = Math.max(...chartData.map((item) => item.ventas));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorBarGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.7} />
          </linearGradient>
          <linearGradient id="colorBarGray" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#9ca3af" stopOpacity={0.6} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="day"
          stroke="#6b7280"
          style={{ fontSize: "12px" }}
          tick={{ fill: "#6b7280" }}
        />
        <YAxis
          stroke="#6b7280"
          style={{ fontSize: "12px" }}
          tick={{ fill: "#6b7280" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
          formatter={(value: number, name: string) => [
            name === "ventas" ? value : formatCurrency(value),
            name === "ventas" ? "Ventas" : "Monto",
          ]}
          labelStyle={{ color: "#1f2937", fontWeight: "600" }}
        />
        <Bar dataKey="ventas" radius={[8, 8, 0, 0]} maxBarSize={50}>
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                entry.ventas === maxSales
                  ? "url(#colorBarGreen)"
                  : "url(#colorBarGray)"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SalesByDayChart;
