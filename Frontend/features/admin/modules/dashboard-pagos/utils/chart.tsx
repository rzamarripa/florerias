"use client"

import React from 'react'
import { LineChart, PieChart, } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { CanvasRenderer, } from 'echarts/renderers';
import dynamic from "next/dynamic";
import { useIsClient } from "usehooks-ts";

import { getEchartOptions, getOrdersStatsOptions, getWorldMapOptions } from "./data";
import { InvoicesPackage } from '../services/dashboardPagosService';

const EChartClient = dynamic(() => import("@/components/common/EChartClient"), { ssr: false });
const BaseVectorMap = dynamic(() => import("@/components/common/maps/BaseVectorMap"), { ssr: false });

export const DonutChart = () => {
  return (
    <EChartClient
      extensions={[PieChart, TooltipComponent, CanvasRenderer]}
      getOptions={getEchartOptions}
      style={{ height: 60, width: 60 }}
    />
  )
}

interface OrdersChartProps {
  paquetes?: InvoicesPackage[];
  selectedCompany?: string;
  totalCompanyBudget?: number; // Presupuesto total de la razón social
  selectedYear?: number;
  selectedMonth?: number;
  filteredBranches?: any[];
  filteredBrands?: any[];
  branchBudgetData?: any[]; // Datos de presupuestos por sucursal
}

export const OrdersChart: React.FC<OrdersChartProps> = ({ paquetes = [], selectedCompany, totalCompanyBudget, selectedYear, selectedMonth, filteredBranches = [], filteredBrands = [], branchBudgetData }) => {


  // Solo renderizar la gráfica si tenemos los datos necesarios
  if (!selectedCompany || !branchBudgetData || branchBudgetData.length === 0) {
    return (
      <div style={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-muted">
          {!selectedCompany 
            ? "Selecciona una razón social para ver los presupuestos de las sucursales"
            : "No hay datos de presupuesto disponibles para esta razón social"
          }
        </p>
      </div>
    );
  }
  
  return (
    <EChartClient
      extensions={[LineChart, TooltipComponent, CanvasRenderer]}
      getOptions={() => getOrdersStatsOptions(paquetes, selectedCompany, totalCompanyBudget, selectedYear, selectedMonth, filteredBranches, filteredBrands, branchBudgetData)}
      style={{ height: 500 }}
    />
  )
}

export const WorldMap = () => {
  const isClient = useIsClient()
  return (
    isClient && <BaseVectorMap type="world" options={getWorldMapOptions()} style={{ height: 297 }} />
  )
}