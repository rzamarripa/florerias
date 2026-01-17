"use client";

import React, { useEffect, useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { financeService } from "../services/finance";
import { FinanceFilters, FinanceStats as FinanceStatsType } from "../types";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";

interface FinanceStatsProps {
  filters: FinanceFilters;
}

const FinanceStats: React.FC<FinanceStatsProps> = ({ filters }) => {
  const [stats, setStats] = useState<FinanceStatsType | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    loadStats();
  }, [filters]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await financeService.getFinanceStats(filters);
      if (response.data) {
        setStats(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar estadísticas");
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground mt-3">Cargando estadísticas...</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const StatCard = ({
    title,
    subtitle,
    value,
    icon: Icon,
    iconBg,
    iconColor,
  }: {
    title: string;
    subtitle: string;
    value: number;
    icon: any;
    iconBg: string;
    iconColor: string;
  }) => (
    <Card className="border-0 shadow-[0_1px_1px_rgba(0,0,0,.05)] rounded-[4px]">
      <CardContent className="p-[10px]">
        <div
          className="mb-2 text-[20px] text-[#464545] font-normal mt-2"
        >
          {title}
        </div>
        <div className="flex items-center justify-start mb-3 gap-2">
          <div
            className="w-10 h-[30px] rounded-lg flex items-center justify-center"
            style={{ backgroundColor: iconBg }}
          >
            <Icon size={20} color={iconColor} strokeWidth={2} />
          </div>
          <h2
            className="mb-1 text-[25px] font-normal text-[#4b4a4a] leading-tight"
          >
            {formatCurrency(value)}
          </h2>
        </div>
        <div
          className="flex items-center justify-between mt-[15px] pt-[15px] border-t border-[#f2f2f2]"
        >
          <span className="text-xs text-[#999]">{subtitle}</span>
          <span className="text-xs font-semibold text-[#2e2e2e]">
            {formatCurrency(value)}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="my-3">
      <h5 className="font-bold mb-3">Totales</h5>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          title="Florería"
          subtitle="Total Florería"
          value={stats.totalFloreria}
          icon={DollarSign}
          iconBg="#e8f4fd"
          iconColor="#5c9fd8"
        />
        <StatCard
          title="Eventos"
          subtitle="Total Eventos"
          value={stats.totalEventos}
          icon={DollarSign}
          iconBg="#e8f8f0"
          iconColor="#28a745"
        />
        <StatCard
          title="Gastos"
          subtitle="Total Gastos"
          value={stats.totalGastos}
          icon={TrendingDown}
          iconBg="#ffe8e8"
          iconColor="#dc3545"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
        <StatCard
          title="Compras"
          subtitle="Total Compras"
          value={stats.totalCompras}
          icon={TrendingDown}
          iconBg="#fff4e6"
          iconColor="#fd7e14"
        />
        <div className="md:col-span-2">
          <Card className="border-0 bg-primary text-white shadow-[0_1px_1px_rgba(0,0,0,.05)] rounded-[4px]">
            <CardContent className="p-3">
              <div className="flex items-start justify-between mb-3">
                <div
                  className="bg-white/25 w-[45px] h-[45px] rounded-lg flex items-center justify-center"
                >
                  <TrendingUp size={20} color="#fff" strokeWidth={2} />
                </div>
                <h2 className="mb-1 text-[32px] font-medium leading-tight">
                  {formatCurrency(stats.utilidad)}
                </h2>
              </div>

              <div className="text-sm font-normal mt-2 opacity-90">
                Utilidad Total
              </div>
              <div className="border-t border-white/25 text-xs opacity-70 mt-[15px] pt-[15px]">
                (Florería + Eventos) - (Gastos + Compras)
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FinanceStats;
