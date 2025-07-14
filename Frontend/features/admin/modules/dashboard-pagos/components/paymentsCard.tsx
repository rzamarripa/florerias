import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { Badge, Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { TbSquareFilled } from 'react-icons/tb'
import CountUpClient from '@/components/common/CountUpClient'
import { cardData } from '../utils/data'
import { PaquetesEnviadosResponse } from '../services/dashboardPagosService'
import { PieChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';

const DonutChart = dynamic(() => import('../utils/chart').then((mod) => mod.DonutChart));

interface EcomStatsProps {
  budgetData?: any[];
  paquetesEnviadosData?: PaquetesEnviadosResponse;
  selectedCompany?: string;
}

type FiltroTipoPago = 'facturas' | 'efectivo' | null;

const filtroLabels: Record<Exclude<FiltroTipoPago, null>, string> = {
  efectivo: 'Efectivo',
  facturas: 'Facturas',
};

const filtroColors: Record<Exclude<FiltroTipoPago, null>, string> = {
  efectivo: '#22c55e',
  facturas: '#3b82f6',
};

const EcomStats: React.FC<EcomStatsProps> = ({ 
  budgetData = [], 
  paquetesEnviadosData = {
    totalPaquetes: 0,
    totalPagado: 0,
    paquetes: []
  },
  selectedCompany
}) => {
  // Filtros independientes para cada card
  const [filtroEnviados, setFiltroEnviados] = useState<FiltroTipoPago>(null);
  const [filtroBorrador, setFiltroBorrador] = useState<FiltroTipoPago>(null);

  const totalBudget = budgetData.reduce((sum, budget) => sum + (budget.assignedAmount || 0), 0);
  const totalBudgetInK = totalBudget / 1000;

  // Elimina variables y cálculos no usados del bloque global de paquetesEnviadosData.paquetes.forEach
  // (El bloque de cálculo global de totalPagadoFacturas, totalPagadoEfectivo, countFacturas, countEfectivo, donutData, totalPagadoInK, porcentaje, porcentajeEfectivo, porcentajeFacturas se puede eliminar completamente)

  // Card de Pagos En Transito (igual que Pagos Realizados pero solo con paquetes "Borrador")
  let totalPagadoFacturasBorrador = 0;
  let totalPagadoEfectivoBorrador = 0;
  let countFacturasBorrador = 0;
  let countEfectivoBorrador = 0;
  let totalPaquetesBorrador = 0;

  paquetesEnviadosData.paquetes.forEach(paquete => {
    if (paquete.estatus === 'Borrador') {
      totalPaquetesBorrador++;
      if (Array.isArray(paquete.facturas)) {
        paquete.facturas.forEach(factura => {
          if (factura.autorizada === true) {
            totalPagadoFacturasBorrador += factura.importePagado || 0;
            countFacturasBorrador++;
          }
        });
      }
      if (Array.isArray(paquete.pagosEfectivo)) {
        paquete.pagosEfectivo.forEach(pago => {
          if (pago.autorizada === true) {
            totalPagadoEfectivoBorrador += pago.importePagado || 0;
            countEfectivoBorrador++;
          }
        });
      }
    }
  });

  const totalPagadoAmbosBorrador = totalPagadoFacturasBorrador + totalPagadoEfectivoBorrador;
  let totalPagadoMostrarBorrador: number;
  let donutDataBorrador: any[];
  if (filtroBorrador === null) {
    totalPagadoMostrarBorrador = totalPagadoAmbosBorrador;
    const efectivoPercent = totalPagadoAmbosBorrador > 0 ? totalPagadoEfectivoBorrador : 0;
    const facturasPercent = totalPagadoAmbosBorrador > 0 ? totalPagadoFacturasBorrador : 0;
    donutDataBorrador = [
      { value: efectivoPercent, name: 'Efectivo', itemStyle: { color: filtroColors.efectivo } },
      { value: facturasPercent, name: 'Facruras', itemStyle: { color: filtroColors.facturas } },
    ];
  } else {
    totalPagadoMostrarBorrador = filtroBorrador === 'facturas' ? totalPagadoFacturasBorrador : totalPagadoEfectivoBorrador;
    donutDataBorrador = [
      { value: totalPagadoMostrarBorrador, name: filtroLabels[filtroBorrador], itemStyle: { color: filtroColors[filtroBorrador] } },
      { value: Math.max(0, totalPagadoAmbosBorrador - totalPagadoMostrarBorrador), name: '', itemStyle: { color: '#e5e7eb' } },
    ];
  }
  const totalPagadoInKBorrador = totalPagadoMostrarBorrador / 1000;
  const porcentajeBorrador = totalPagadoAmbosBorrador > 0 ? Math.round((totalPagadoMostrarBorrador / totalPagadoAmbosBorrador) * 100) : 0;

  // Card de Pagos Realizados (solo paquetes con estatus "Enviado")
  let totalPagadoFacturasEnviados = 0;
  let totalPagadoEfectivoEnviados = 0;
  let countFacturasEnviados = 0;
  let countEfectivoEnviados = 0;
  let totalPaquetesEnviados = 0;

  paquetesEnviadosData.paquetes.forEach(paquete => {
    if (paquete.estatus === 'Enviado') {
      totalPaquetesEnviados++;
      if (Array.isArray(paquete.facturas)) {
        paquete.facturas.forEach(factura => {
          if (factura.autorizada === true) {
            totalPagadoFacturasEnviados += factura.importePagado || 0;
            countFacturasEnviados++;
          }
        });
      }
      if (Array.isArray(paquete.pagosEfectivo)) {
        paquete.pagosEfectivo.forEach(pago => {
          if (pago.autorizada === true) {
            totalPagadoEfectivoEnviados += pago.importePagado || 0;
            countEfectivoEnviados++;
          }
        });
      }
    }
  });

  const totalPagadoAmbosEnviados = totalPagadoFacturasEnviados + totalPagadoEfectivoEnviados;
  let totalPagadoMostrarEnviados: number;
  let donutDataEnviados: any[];
  if (filtroEnviados === null) {
    totalPagadoMostrarEnviados = totalPagadoAmbosEnviados;
    const efectivoPercent = totalPagadoAmbosEnviados > 0 ? totalPagadoEfectivoEnviados : 0;
    const facturasPercent = totalPagadoAmbosEnviados > 0 ? totalPagadoFacturasEnviados : 0;
    donutDataEnviados = [
      { value: efectivoPercent, name: 'Efectivo', itemStyle: { color: filtroColors.efectivo } },
      { value: facturasPercent, name: 'Facruras', itemStyle: { color: filtroColors.facturas } },
    ];
  } else {
    totalPagadoMostrarEnviados = filtroEnviados === 'facturas' ? totalPagadoFacturasEnviados : totalPagadoEfectivoEnviados;
    donutDataEnviados = [
      { value: totalPagadoMostrarEnviados, name: filtroLabels[filtroEnviados], itemStyle: { color: filtroColors[filtroEnviados] } },
      { value: Math.max(0, totalPagadoAmbosEnviados - totalPagadoMostrarEnviados), name: '', itemStyle: { color: '#e5e7eb' } },
    ];
  }
  const totalPagadoInKEnviados = totalPagadoMostrarEnviados / 1000;
  const porcentajeEnviados = totalPagadoAmbosEnviados > 0 ? Math.round((totalPagadoMostrarEnviados / totalPagadoAmbosEnviados) * 100) : 0;

  // Calcular el saldo (presupuesto total - gastos realizados)
  const totalGastosRealizados = totalPagadoAmbosEnviados + totalPagadoAmbosBorrador;
  const saldo = totalBudget - totalGastosRealizados;
  const saldoInK = saldo / 1000;
  const esSaldoPositivo = saldo >= 0;
  
  // Calcular porcentaje de presupuesto disponible para el donut (más preciso)
  const porcentajeDisponible = totalBudget > 0 ? ((saldo / totalBudget) * 100) : 0;
  
  // Datos para el donut del presupuesto
  const donutDataPresupuesto = [
    { value: totalGastosRealizados, name: 'Gastado', itemStyle: { color: '#ef4444' } },
    { value: Math.max(0, saldo), name: 'Disponible', itemStyle: { color: '#22c55e' } }
  ];

  return (
    <Row xs={1} md={2} xxl={4}>
      <Col>
        <Card>
          <CardHeader className="d-flex border-dashed justify-content-between align-items-center">
            <CardTitle as="h5">{cardData[0].title}</CardTitle>
            <Badge bg={cardData[0].badgeColor} className={`bg-opacity-10 text-${cardData[0].badgeColor}`}>{cardData[0].badgeText}</Badge>
          </CardHeader>
          <CardBody className="d-flex flex-column justify-content-center p-3 h-100">
            <div className="d-flex justify-content-between align-items-center text-nowrap">
              <div className="flex-grow-1">
                <DonutChart />
              </div>
              <div className="text-end">
                <h3 className="mb-2 fw-normal">
                  {cardData[0]?.prefix}<CountUpClient duration={1} end={totalBudgetInK} />{cardData[0]?.suffix}
                </h3>
                <p className="mb-0 text-muted">
                  <span>{selectedCompany ? `Presupuesto asignado del período` : 'Selecciona Razón Social'}</span>
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </Col>

      {/* Card de Paquetes Pagados rediseñado */}
      <Col>
        <Card>
          <CardHeader className="d-flex border-dashed justify-content-between align-items-center">
            <CardTitle as="h5">Pagos Realizados</CardTitle>
            <Badge bg={cardData[1].badgeColor} className={`bg-opacity-10 text-${cardData[1].badgeColor}`}>{cardData[1].badgeText}</Badge>
          </CardHeader>
          <CardBody className="d-flex flex-row align-items-center justify-content-center p-3 h-100 " style={{ minHeight: 90, maxHeight: 100 }}>
            <div style={{ position: 'relative', width: 60, height: 60, marginBottom: 0,marginRight: 30, }}>
              <DonutChartCustom data={donutDataEnviados} porcentaje={porcentajeEnviados} />
            </div>
            <div className="d-flex flex-column justify-content-center align-items-start gap-1 my-2" style={{ fontSize: 13,marginRight: 15 }}>
              <div className="d-flex flex-column align-items-start gap-2 mb-2">
                <div 
                  className="d-flex align-items-center gap-1 cursor-pointer"
                  onClick={() => setFiltroEnviados(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <TbSquareFilled style={{ 
                    color: filtroEnviados === null ? '#6c757d' : '#e5e7eb', 
                    fontSize: 14 
                  }} />
                  <small style={{ color: filtroEnviados === null ? '#333' : '#9ca3af' }}>Ambos</small>
                </div>
                <div 
                  className="d-flex align-items-center gap-1 cursor-pointer"
                  onClick={() => setFiltroEnviados('efectivo')}
                  style={{ cursor: 'pointer' }}
                >
                  <TbSquareFilled style={{ 
                    color: filtroEnviados === 'efectivo' ? filtroColors.efectivo : '#e5e7eb', 
                    fontSize: 14 
                  }} />
                  <small style={{ color: filtroEnviados === 'efectivo' ? filtroColors.efectivo : '#9ca3af' }}>
                    {filtroLabels.efectivo} ({countEfectivoEnviados})
                  </small>
                </div>
                <div 
                  className="d-flex align-items-center gap-1 cursor-pointer"
                  onClick={() => setFiltroEnviados('facturas')}
                  style={{ cursor: 'pointer' }}
                >
                  <TbSquareFilled style={{ 
                    color: filtroEnviados === 'facturas' ? filtroColors.facturas : '#e5e7eb', 
                    fontSize: 14 
                  }} />
                  <small style={{ color: filtroEnviados === 'facturas' ? filtroColors.facturas : '#9ca3af' }}>
                    {filtroLabels.facturas} ({countFacturasEnviados})
                  </small>
                </div>
              </div>
            </div>
            <div className="d-flex flex-column justify-content-center align-items-center gap-1" style={{ marginLeft: 15 }}>
            <div className="mb-1 ">
              <span className="fw-bold" style={{ fontSize: 16 }}>{totalPaquetesEnviados} paquetes</span>
            </div>
            <div>
              <span className="fw-bold text-primary" style={{ fontSize: 18 }}>${totalPagadoInKEnviados.toFixed(1)}K</span>
            </div>
            </div>
          </CardBody>
        </Card>
      </Col>

      {/* Card de Pagos En Transito rediseñado */}
      <Col>
        <Card>
          <CardHeader className="d-flex border-dashed justify-content-between align-items-center">
            <CardTitle as="h5">{cardData[2].title}</CardTitle>
            <Badge bg={cardData[2].badgeColor} className={`bg-opacity-10 text-${cardData[2].badgeColor}`}>{cardData[2].badgeText}</Badge>
          </CardHeader>
          <CardBody className="d-flex flex-row align-items-center justify-content-center p-3 h-100 " style={{ minHeight: 90, maxHeight: 100 }}>
            <div style={{ position: 'relative', width: 60, height: 60, marginBottom: 0,marginRight: 15}}>
              <DonutChartCustom data={donutDataBorrador} porcentaje={porcentajeBorrador} />
            </div>
            <div className="d-flex flex-column justify-content-center align-items-start gap-1 my-2" style={{ fontSize: 13,marginRight: 15 }}>
              <div className="d-flex flex-column align-items-start gap-2 mb-2">
                <div 
                  className="d-flex align-items-center gap-1 cursor-pointer"
                  onClick={() => setFiltroBorrador(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <TbSquareFilled style={{ 
                    color: filtroBorrador === null ? '#6c757d' : '#e5e7eb', 
                    fontSize: 14 
                  }} />
                  <small style={{ color: filtroBorrador === null ? '#333' : '#9ca3af' }}>Ambos</small>
                </div>
                <div 
                  className="d-flex align-items-center gap-1 cursor-pointer"
                  onClick={() => setFiltroBorrador('efectivo')}
                  style={{ cursor: 'pointer' }}
                >
                  <TbSquareFilled style={{ 
                    color: filtroBorrador === 'efectivo' ? filtroColors.efectivo : '#e5e7eb', 
                    fontSize: 14 
                  }} />
                  <small style={{ color: filtroBorrador === 'efectivo' ? filtroColors.efectivo : '#9ca3af' }}>
                    {filtroLabels.efectivo} ({countEfectivoBorrador})
                  </small>
                </div>
                <div 
                  className="d-flex align-items-center gap-1 cursor-pointer"
                  onClick={() => setFiltroBorrador('facturas')}
                  style={{ cursor: 'pointer' }}
                >
                  <TbSquareFilled style={{ 
                    color: filtroBorrador === 'facturas' ? filtroColors.facturas : '#e5e7eb', 
                    fontSize: 14 
                  }} />
                  <small style={{ color: filtroBorrador === 'facturas' ? filtroColors.facturas : '#9ca3af' }}>
                    {filtroLabels.facturas} ({countFacturasBorrador})
                  </small>
                </div>
              </div>
            </div>
            <div className="d-flex flex-column justify-content-center align-items-center gap-1" style={{ marginLeft: 15 }}>
            <div className="mb-1 ">
              <span className="fw-bold" style={{ fontSize: 16 }}>{totalPaquetesBorrador} paquetes</span>
            </div>
            <div>
              <span className="fw-bold text-primary" style={{ fontSize: 18 }}>${totalPagadoInKBorrador.toFixed(1)}K</span>
            </div>
            </div>
          </CardBody>
        </Card>
      </Col>

      {/* Card de Saldo */}
      <Col>
        <Card>
          <CardHeader className="d-flex border-dashed justify-content-between align-items-center">
            <CardTitle as="h5">Presupuesto Disponble</CardTitle>
            <Badge bg={esSaldoPositivo ? "success" : "danger"} className={`bg-opacity-10 text-${esSaldoPositivo ? "success" : "danger"}`}>
              {esSaldoPositivo ? "A Favor" : "En Contra"}
            </Badge>
          </CardHeader>
          <CardBody>
            <div className="d-flex justify-content-between align-items-center text-nowrap">
              <div className="d-flex align-items-center">
              <div className="flex-grow-1">
                <DonutChartCustom data={donutDataPresupuesto} porcentaje={porcentajeDisponible} />
              </div>
              <div className="d-flex flex-column align-items-center justify-content-center" style={{ marginLeft: 15 }}>
                <div className="d-flex flex-column gap-1 mb-2">
                  <div className="d-flex align-items-center gap-1">
                    <TbSquareFilled style={{ color: '#ef4444', fontSize: 12 }} />
                    <small className="text-muted">Gastado</small>
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <TbSquareFilled style={{ color: '#22c55e', fontSize: 12 }} />
                    <small className="text-muted">Disponible</small>
                  </div>
                </div>
              </div>
              </div>
              <div className="text-end">
                <h3 className="mb-2 fw-normal">
                  <span style={{ color: esSaldoPositivo ? '#22c55e' : '#ef4444' }}>
                    {esSaldoPositivo ? '+' : ''}${saldoInK.toFixed(1)}K
                  </span>
                </h3>
                <p className="mb-0 text-muted">
                  <span>{porcentajeDisponible.toFixed(1)}% disponible</span>
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </Col>
    </Row>
  )
}

const DonutChartCustom: React.FC<{ data: any[]; porcentaje: number | null }> = ({ data, porcentaje }) => {
  const EChartClient = dynamic(() => import('@/components/common/EChartClient'), { ssr: false });
  const getOptions = () => ({
    tooltip: { show: true },
    series: [
      {
        type: 'pie' as const,
        radius: ['65%', '100%'],
        label: { show: false },
        labelLine: { show: false },
        data
      }
    ],
    graphic: porcentaje !== null ? [
      {
        type: 'text',
        left: 'center',
        top: 'center',
        style: {
          text: `${porcentaje.toFixed(1)}%`,
          fontSize: 12,
          fontWeight: 'bold',
          fill: '#333'
        }
      }
    ] : []
  });
  return <EChartClient extensions={[PieChart, CanvasRenderer]} getOptions={getOptions} style={{ height: 60, width: 60 }} />
}

export default EcomStats