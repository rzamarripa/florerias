import React from "react";
import { Card, CardBody } from "react-bootstrap";
import CountUp from "react-countup";

interface BudgetStatisticCardProps {
  title: string;
  subtitle: string;
  stats: string | number;
  icon: React.ReactNode;
  variant?: string;
}

const BudgetStatisticCard: React.FC<BudgetStatisticCardProps> = ({
  title,
  subtitle,
  stats,
  icon,
  variant,
}) => {
  const isNumber = !isNaN(parseFloat(String(stats))) && isFinite(Number(stats));
  const endValue = isNumber ? parseFloat(String(stats)) : 0;
  const prefix = typeof stats === "string" && stats.startsWith("$") ? "$" : "";
  const suffix = typeof stats === "string" && stats.endsWith("M") ? "M" : "";

  return (
    <Card
      className="border-1 shadow-sm p-0 m-0"
      style={{
        borderRadius: 5,
        minHeight: 100,
        background:
          variant === "info"
            ? "linear-gradient(135deg, #5fd0d6 0%, #38c0d4 100%)"
            : variant === "primary"
            ? "linear-gradient(135deg, #7eb6f8 0%, #3c83f6 100%)"
            : variant === "warning"
            ? "linear-gradient(135deg, #ffe082 0%, #ffd54f 100%)"
            : variant === "secondary"
            ? "linear-gradient(135deg, #b0b4b9 0%, #868f96 100%)"
            : "#f8fafc",
      }}
    >
      <CardBody
        style={{
          minHeight: 40,
          position: "relative",
          padding: "0.5rem 0.5rem 0.25rem 0.5rem",
        }}
      >
        <div className="d-flex flex-column justify-content-between h-100 p-0 m-0 space-x-1">
          <div>
            <h5
              className="mb-0 text-white fw-bold pb-1"
              style={{ fontSize: "1rem", lineHeight: "1.1" }}
            >
              {isNumber ? (
                <CountUp
                  prefix={prefix}
                  suffix={suffix}
                  duration={1}
                  end={endValue}
                  separator=","
                />
              ) : (
                stats
              )}
            </h5>
            <div className="d-flex align-items-center mb-0 mt-1 pb-1">
              <span
                className="me-1"
                style={{
                  color: "#fff",
                  opacity: 0.95,
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {icon}
              </span>
              <span
                className="fw-bold text-white"
                style={{ fontSize: "0.85rem" }}
              >
                {title}
              </span>
            </div>
            <div
              className="text-white-50 small"
              style={{ fontSize: "0.75rem" }}
            >
              {subtitle}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default BudgetStatisticCard;
