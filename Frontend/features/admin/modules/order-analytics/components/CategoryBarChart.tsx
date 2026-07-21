"use client";

import React from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { SalesByCategory } from "../types";

interface CategoryBarChartProps {
  data: SalesByCategory[];
}

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(value);

const CategoryBarChart: React.FC<CategoryBarChartProps> = ({ data }) => {
  const chartData = [...data]
    .sort((a, b) => b.total - a.total)
    .map((item) => ({
      name: item.category,
      total: item.total,
      percentage: item.percentage,
    }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(value) => formatCurrency(value)}
          style={{ fontSize: "11px" }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          style={{ fontSize: "12px" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
          formatter={(value: number, _name: string, props: any) => [
            `${formatCurrency(value)} (${props.payload.percentage.toFixed(1)}%)`,
            props.payload.name,
          ]}
        />
        <Bar dataKey="total" radius={[0, 6, 6, 0]}>
          {chartData.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
          <LabelList
            dataKey="percentage"
            position="right"
            formatter={(value: number) => `${value.toFixed(1)}%`}
            style={{ fontSize: "11px", fill: "#374151", fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default CategoryBarChart;
