"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import CountUpClient from "@/components/common/CountUpClient";
import EChartClient from "@/components/common/EChartClient";
import {
  TbUsers,
  TbShoppingBag,
  TbChartLine,
  TbCurrencyDollar,
} from "react-icons/tb";
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from "echarts/components";
import { LineChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import { type EChartsOption } from "echarts";

export default function Page() {
  const chartOptions: EChartsOption = {
    tooltip: { trigger: "axis" },
    grid: { left: 24, right: 24, top: 24, bottom: 24 },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      axisLine: { lineStyle: { color: "#e9ecef" } },
      axisLabel: { color: "#6c757d" },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: "#e9ecef" } },
      axisLabel: { color: "#6c757d" },
    },
    series: [
      {
        name: "Sessions",
        type: "line",
        smooth: true,
        showSymbol: false,
        areaStyle: {
          opacity: 0.15,
        },
        lineStyle: { width: 3 },
        data: [120, 200, 150, 80, 70, 110, 130],
      },
    ],
    color: ["#4e73df"],
  };

  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Dashboard" subtitle="Overview" section="Admin" />

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100">
            <div className="card-body d-flex align-items-center">
              <div
                className="flex-shrink-0 rounded-circle bg-primary bg-opacity-10 text-primary d-inline-flex align-items-center justify-content-center"
                style={{ width: 48, height: 48 }}
              >
                <TbUsers size={22} />
              </div>
              <div className="ms-3">
                <div className="text-muted small">Users</div>
                <div className="fs-4 fw-semibold">
                  <CountUpClient start={0} end={1280} duration={1.2} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100">
            <div className="card-body d-flex align-items-center">
              <div
                className="flex-shrink-0 rounded-circle bg-success bg-opacity-10 text-success d-inline-flex align-items-center justify-content-center"
                style={{ width: 48, height: 48 }}
              >
                <TbShoppingBag size={22} />
              </div>
              <div className="ms-3">
                <div className="text-muted small">Orders</div>
                <div className="fs-4 fw-semibold">
                  <CountUpClient start={0} end={342} duration={1.2} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100">
            <div className="card-body d-flex align-items-center">
              <div
                className="flex-shrink-0 rounded-circle bg-warning bg-opacity-10 text-warning d-inline-flex align-items-center justify-content-center"
                style={{ width: 48, height: 48 }}
              >
                <TbChartLine size={22} />
              </div>
              <div className="ms-3">
                <div className="text-muted small">Growth</div>
                <div className="fs-4 fw-semibold">
                  <CountUpClient start={0} end={76} duration={1.2} suffix="%" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100">
            <div className="card-body d-flex align-items-center">
              <div
                className="flex-shrink-0 rounded-circle bg-info bg-opacity-10 text-info d-inline-flex align-items-center justify-content-center"
                style={{ width: 48, height: 48 }}
              >
                <TbCurrencyDollar size={22} />
              </div>
              <div className="ms-3">
                <div className="text-muted small">Revenue</div>
                <div className="fs-4 fw-semibold">
                  $
                  <CountUpClient
                    start={0}
                    end={58200}
                    duration={1.2}
                    separator=","
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="mb-0">Sessions Overview</h5>
              <span className="text-muted small">Last 7 days</span>
            </div>
            <div className="card-body">
              <EChartClient
                style={{ height: 320 }}
                getOptions={() => chartOptions}
                extensions={[
                  TitleComponent,
                  TooltipComponent,
                  GridComponent,
                  LegendComponent,
                  LineChart,
                  CanvasRenderer,
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
