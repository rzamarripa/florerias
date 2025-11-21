"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { SalesByPaymentMethod } from "../types";
import { Row, Col } from "react-bootstrap";
import { DollarSign, CreditCard, ArrowLeftRight } from "lucide-react";

interface PaymentMethodChartProps {
  data: SalesByPaymentMethod[];
}

const COLORS: Record<string, string> = {
  efectivo: "#10b981",
  tarjeta: "#3b82f6",
  transferencia: "#8b5cf6",
};

const ICONS: Record<string, any> = {
  efectivo: DollarSign,
  tarjeta: CreditCard,
  transferencia: ArrowLeftRight,
};

const PaymentMethodChart: React.FC<PaymentMethodChartProps> = ({ data }) => {
  const chartData = data.map((item) => ({
    name: item.method,
    value: item.amount,
    count: item.count,
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getColor = (method: string) => {
    const key = method.toLowerCase();
    return COLORS[key] || "#6b7280";
  };

  const getIcon = (method: string) => {
    const key = method.toLowerCase();
    return ICONS[key] || DollarSign;
  };

  return (
    <div className="d-flex flex-column h-100">
      <div className="flex-grow-1" style={{ minHeight: "180px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.name)} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              formatter={(value: number, name: string, props: any) => [
                formatCurrency(value),
                `${props.payload.name} (${props.payload.count} ventas)`,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <Row className="g-2 mt-2">
        {data.map((item) => {
          const Icon = getIcon(item.method);
          const color = getColor(item.method);
          const bgColor = color + "15";

          return (
            <Col xs={4} key={item.method}>
              <div
                className="p-2 rounded text-center"
                style={{ backgroundColor: bgColor }}
              >
                <Icon size={20} color={color} className="mb-1" />
                <div className="small text-muted text-truncate">
                  {item.method}
                </div>
                <strong style={{ color, fontSize: "0.875rem" }}>
                  {formatCurrency(item.amount)}
                </strong>
              </div>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default PaymentMethodChart;
