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
  Legend,
} from "recharts";
import { MonthlyComparison } from "../types";

interface MonthComparisonChartProps {
  data: MonthlyComparison;
}

const MonthComparisonChart: React.FC<MonthComparisonChartProps> = ({ data }) => {
  const chartData = [
    {
      name: "Ventas",
      actual: data.currentMonth.sales,
      anterior: data.previousMonth.sales,
    },
    {
      name: "Ingresos",
      actual: data.currentMonth.revenue,
      anterior: data.previousMonth.revenue,
    },
  ];

  const formatValue = (value: number, name: string) => {
    if (name.includes("Ingresos") || name === "Ingresos") {
      return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 0,
      }).format(value);
    }
    return value.toString();
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="name"
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
          formatter={(value: number, name: string, props: any) => [
            formatValue(value, props.payload.name),
            name === "actual" ? "Mes Actual" : "Mes Anterior",
          ]}
          labelStyle={{ color: "#1f2937", fontWeight: "600" }}
        />
        <Legend
          wrapperStyle={{ fontSize: "12px" }}
          iconType="circle"
          formatter={(value) => (value === "actual" ? "Mes Actual" : "Mes Anterior")}
        />
        <Bar dataKey="actual" fill="#10b981" radius={[8, 8, 0, 0]} maxBarSize={40} />
        <Bar dataKey="anterior" fill="#93c5fd" radius={[8, 8, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default MonthComparisonChart;
