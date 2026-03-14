"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle, Activity } from "lucide-react";
import { BranchSessionStats } from "../types";

interface BranchSessionCardProps {
  branch: BranchSessionStats;
  onClick?: () => void;
}

const BranchSessionCard: React.FC<BranchSessionCardProps> = ({ branch, onClick }) => {
  const formatHours = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} min`;
    }
    return `${hours.toFixed(1)} hrs`;
  };

  return (
    <Card
      className="h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="mb-4">
          <h5 className="font-bold mb-1">{branch.branchName}</h5>
          <p className="text-muted-foreground text-sm">{branch.branchCode}</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* Total Hours */}
          <div
            className="p-3 rounded-lg flex items-center gap-3"
            style={{
              background:
                "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
            }}
          >
            <Clock size={22} style={{ color: "#667eea" }} />
            <div className="flex-1">
              <p
                className="text-[10px] font-semibold tracking-wide"
                style={{ color: "#667eea" }}
              >
                HORAS TOTALES
              </p>
              <p className="font-bold text-lg" style={{ color: "#667eea" }}>
                {formatHours(branch.totalHours)}
              </p>
            </div>
          </div>

          {/* Closed Session Hours */}
          <div
            className="p-3 rounded-lg flex items-center gap-3"
            style={{
              background:
                "linear-gradient(135deg, #43e97b15 0%, #38f9d715 100%)",
            }}
          >
            <CheckCircle size={22} style={{ color: "#43e97b" }} />
            <div className="flex-1">
              <p
                className="text-[10px] font-semibold tracking-wide"
                style={{ color: "#2d9e5a" }}
              >
                SESIONES CERRADAS
              </p>
              <p className="font-bold text-lg" style={{ color: "#43e97b" }}>
                {formatHours(branch.closedSessionHours)}
              </p>
            </div>
          </div>

          {/* Active Session Hours */}
          <div
            className="p-3 rounded-lg flex items-center gap-3"
            style={{
              background:
                "linear-gradient(135deg, #4facfe15 0%, #00f2fe15 100%)",
            }}
          >
            <Activity size={22} style={{ color: "#4facfe" }} />
            <div className="flex-1">
              <p
                className="text-[10px] font-semibold tracking-wide"
                style={{ color: "#3a8dd6" }}
              >
                SESIONES ACTIVAS
              </p>
              <p className="font-bold text-lg" style={{ color: "#4facfe" }}>
                {formatHours(branch.activeSessionHours)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BranchSessionCard;
