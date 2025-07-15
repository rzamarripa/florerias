import React, { useState, useMemo } from 'react'
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

// Componente independiente para el card de presupuesto total
const PresupuestoTotalCard: React.FC<{ budgetData: any[]; selectedCompany?: string }> = React.memo(({ budgetData, selectedCompany }) => {
  const totalBudget = useMemo(() => {
    return budgetData.reduce((sum, budget) => sum + (budget.assignedAmount || 0), 0);
  }, [budgetData]);

  return (
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
                {cardData[0]?.prefix}<CountUpClient duration={1} end={totalBudget} />{cardData[0]?.suffix}
              </h3>
              <p className="mb-0 text-muted">
                <span>{selectedCompany ? `Presupuesto asignado del período` : 'Selecciona Razón Social'}</span>
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </Col>
  );
});
PresupuestoTotalCard.displayName = 'PresupuestoTotalCard';

// Componente independiente para el card de pagos realizados
const PagosRealizadosCard: React.FC<{ paquetesEnviadosData: PaquetesEnviadosResponse }> = React.memo(({ paquetesEnviadosData }) => {
  const [filtroEnviados, setFiltroEnviados] = useState<FiltroTipoPago>(null);

  const datosEnviados = useMemo(() => {
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

    return {
      totalPagadoFacturasEnviados,
      totalPagadoEfectivoEnviados,
      countFacturasEnviados,
      countEfectivoEnviados,
      totalPaquetesEnviados
    };
  }, [paquetesEnviadosData.paquetes]);

  const cardEnviados = useMemo(() => {
    const totalPagadoAmbosEnviados = datosEnviados.totalPagadoFacturasEnviados + datosEnviados.totalPagadoEfectivoEnviados;
    let totalPagadoMostrarEnviados: number;
    let donutDataEnviados: any[];
    
    if (filtroEnviados === null) {
      totalPagadoMostrarEnviados = totalPagadoAmbosEnviados;
      const efectivoPercent = totalPagadoAmbosEnviados > 0 ? datosEnviados.totalPagadoEfectivoEnviados : 0;
      const facturasPercent = totalPagadoAmbosEnviados > 0 ? datosEnviados.totalPagadoFacturasEnviados : 0;
      donutDataEnviados = [
        { value: efectivoPercent, name: 'Efectivo', itemStyle: { color: filtroColors.efectivo } },
        { value: facturasPercent, name: 'Facruras', itemStyle: { color: filtroColors.facturas } },
      ];
    } else {
      totalPagadoMostrarEnviados = filtroEnviados === 'facturas' ? datosEnviados.totalPagadoFacturasEnviados : datosEnviados.totalPagadoEfectivoEnviados;
      donutDataEnviados = [
        { value: totalPagadoMostrarEnviados, name: filtroLabels[filtroEnviados], itemStyle: { color: filtroColors[filtroEnviados] } },
        { value: Math.max(0, totalPagadoAmbosEnviados - totalPagadoMostrarEnviados), name: '', itemStyle: { color: '#e5e7eb' } },
      ];
    }
    
    const porcentajeEnviados = totalPagadoAmbosEnviados > 0 ? Math.round((totalPagadoMostrarEnviados / totalPagadoAmbosEnviados) * 100) : 0;

    return {
      totalPagadoMostrarEnviados,
      donutDataEnviados,
      porcentajeEnviados,
      totalPagadoAmbosEnviados
    };
  }, [datosEnviados, filtroEnviados]);

  return (
    <Col>
      <Card>
        <CardHeader className="d-flex border-dashed justify-content-between align-items-center">
          <CardTitle as="h5">Pagos Realizados</CardTitle>
          <Badge bg={cardData[1].badgeColor} className={`bg-opacity-10 text-${cardData[1].badgeColor}`}>{cardData[1].badgeText}</Badge>
        </CardHeader>
        <CardBody className="d-flex flex-row align-items-center justify-content-center p-3 h-100 " style={{ minHeight: 90, maxHeight: 100 }}>
          <div style={{ position: 'relative', width: 60, height: 60, marginBottom: 0,marginRight: 30, }}>
            <DonutChartCustom data={cardEnviados.donutDataEnviados} porcentaje={cardEnviados.porcentajeEnviados} />
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
                  {filtroLabels.efectivo} ({datosEnviados.countEfectivoEnviados})
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
                  {filtroLabels.facturas} ({datosEnviados.countFacturasEnviados})
                </small>
              </div>
            </div>
          </div>
          <div className="d-flex flex-column justify-content-center align-items-center gap-1" style={{ marginLeft: 15 }}>
          <div className="mb-1 ">
            <span className="fw-bold" style={{ fontSize: 16 }}>{datosEnviados.totalPaquetesEnviados} paquetes</span>
          </div>
          <div>
            <span className="fw-bold text-primary" style={{ fontSize: 18 }}>${cardEnviados.totalPagadoMostrarEnviados.toFixed(2)}</span>
          </div>
          </div>
        </CardBody>
      </Card>
    </Col>
  );
});
PagosRealizadosCard.displayName = 'PagosRealizadosCard';

// Componente independiente para el card de pagos en tránsito
const PagosTransitoCard: React.FC<{ paquetesEnviadosData: PaquetesEnviadosResponse }> = React.memo(({ paquetesEnviadosData }) => {
  const [filtroBorrador, setFiltroBorrador] = useState<FiltroTipoPago>(null);

  const datosBorrador = useMemo(() => {
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

    return {
      totalPagadoFacturasBorrador,
      totalPagadoEfectivoBorrador,
      countFacturasBorrador,
      countEfectivoBorrador,
      totalPaquetesBorrador
    };
  }, [paquetesEnviadosData.paquetes]);

  const cardBorrador = useMemo(() => {
    const totalPagadoAmbosBorrador = datosBorrador.totalPagadoFacturasBorrador + datosBorrador.totalPagadoEfectivoBorrador;
    let totalPagadoMostrarBorrador: number;
    let donutDataBorrador: any[];
    
    if (filtroBorrador === null) {
      totalPagadoMostrarBorrador = totalPagadoAmbosBorrador;
      const efectivoPercent = totalPagadoAmbosBorrador > 0 ? datosBorrador.totalPagadoEfectivoBorrador : 0;
      const facturasPercent = totalPagadoAmbosBorrador > 0 ? datosBorrador.totalPagadoFacturasBorrador : 0;
      donutDataBorrador = [
        { value: efectivoPercent, name: 'Efectivo', itemStyle: { color: filtroColors.efectivo } },
        { value: facturasPercent, name: 'Facruras', itemStyle: { color: filtroColors.facturas } },
      ];
    } else {
      totalPagadoMostrarBorrador = filtroBorrador === 'facturas' ? datosBorrador.totalPagadoFacturasBorrador : datosBorrador.totalPagadoEfectivoBorrador;
      donutDataBorrador = [
        { value: totalPagadoMostrarBorrador, name: filtroLabels[filtroBorrador], itemStyle: { color: filtroColors[filtroBorrador] } },
        { value: Math.max(0, totalPagadoAmbosBorrador - totalPagadoMostrarBorrador), name: '', itemStyle: { color: '#e5e7eb' } },
      ];
    }
    
    const porcentajeBorrador = totalPagadoAmbosBorrador > 0 ? Math.round((totalPagadoMostrarBorrador / totalPagadoAmbosBorrador) * 100) : 0;

    return {
      totalPagadoMostrarBorrador,
      donutDataBorrador,
      porcentajeBorrador,
      totalPagadoAmbosBorrador
    };
  }, [datosBorrador, filtroBorrador]);

  return (
    <Col>
      <Card>
        <CardHeader className="d-flex border-dashed justify-content-between align-items-center">
          <CardTitle as="h5">{cardData[2].title}</CardTitle>
          <Badge bg={cardData[2].badgeColor} className={`bg-opacity-10 text-${cardData[2].badgeColor}`}>{cardData[2].badgeText}</Badge>
        </CardHeader>
        <CardBody className="d-flex flex-row align-items-center justify-content-center p-3 h-100 " style={{ minHeight: 90, maxHeight: 100 }}>
          <div style={{ position: 'relative', width: 60, height: 60, marginBottom: 0,marginRight: 15}}>
            <DonutChartCustom data={cardBorrador.donutDataBorrador} porcentaje={cardBorrador.porcentajeBorrador} />
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
                  {filtroLabels.efectivo} ({datosBorrador.countEfectivoBorrador})
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
                  {filtroLabels.facturas} ({datosBorrador.countFacturasBorrador})
                </small>
              </div>
            </div>
          </div>
          <div className="d-flex flex-column justify-content-center align-items-center gap-1" style={{ marginLeft: 15 }}>
          <div className="mb-1 ">
            <span className="fw-bold" style={{ fontSize: 16 }}>{datosBorrador.totalPaquetesBorrador} paquetes</span>
          </div>
          <div>
            <span className="fw-bold text-primary" style={{ fontSize: 18 }}>${cardBorrador.totalPagadoMostrarBorrador.toFixed(2)}</span>
          </div>
          </div>
        </CardBody>
      </Card>
    </Col>
  );
});
PagosTransitoCard.displayName = 'PagosTransitoCard';

// Componente independiente para el card de saldo
const SaldoCard: React.FC<{ budgetData: any[]; paquetesEnviadosData: PaquetesEnviadosResponse }> = React.memo(({ budgetData, paquetesEnviadosData }) => {
  const totalBudget = useMemo(() => {
    return budgetData.reduce((sum, budget) => sum + (budget.assignedAmount || 0), 0);
  }, [budgetData]);

  const datosEnviados = useMemo(() => {
    let totalPagadoFacturasEnviados = 0;
    let totalPagadoEfectivoEnviados = 0;

    paquetesEnviadosData.paquetes.forEach(paquete => {
      if (paquete.estatus === 'Enviado') {
        if (Array.isArray(paquete.facturas)) {
          paquete.facturas.forEach(factura => {
            if (factura.autorizada === true) {
              totalPagadoFacturasEnviados += factura.importePagado || 0;
            }
          });
        }
        if (Array.isArray(paquete.pagosEfectivo)) {
          paquete.pagosEfectivo.forEach(pago => {
            if (pago.autorizada === true) {
              totalPagadoEfectivoEnviados += pago.importePagado || 0;
            }
          });
        }
      }
    });

    return {
      totalPagadoFacturasEnviados,
      totalPagadoEfectivoEnviados
    };
  }, [paquetesEnviadosData.paquetes]);

  const datosBorrador = useMemo(() => {
    let totalPagadoFacturasBorrador = 0;
    let totalPagadoEfectivoBorrador = 0;

    paquetesEnviadosData.paquetes.forEach(paquete => {
      if (paquete.estatus === 'Borrador') {
        if (Array.isArray(paquete.facturas)) {
          paquete.facturas.forEach(factura => {
            if (factura.autorizada === true) {
              totalPagadoFacturasBorrador += factura.importePagado || 0;
            }
          });
        }
        if (Array.isArray(paquete.pagosEfectivo)) {
          paquete.pagosEfectivo.forEach(pago => {
            if (pago.autorizada === true) {
              totalPagadoEfectivoBorrador += pago.importePagado || 0;
            }
          });
        }
      }
    });

    return {
      totalPagadoFacturasBorrador,
      totalPagadoEfectivoBorrador
    };
  }, [paquetesEnviadosData.paquetes]);

  const saldoData = useMemo(() => {
    const totalGastosRealizados = (datosEnviados.totalPagadoFacturasEnviados + datosEnviados.totalPagadoEfectivoEnviados) + 
                                 (datosBorrador.totalPagadoFacturasBorrador + datosBorrador.totalPagadoEfectivoBorrador);
    const saldo = totalBudget - totalGastosRealizados;
    const esSaldoPositivo = saldo >= 0;
    const porcentajeDisponible = totalBudget > 0 ? ((saldo / totalBudget) * 100) : 0;
    
    const donutDataPresupuesto = [
      { value: totalGastosRealizados, name: 'Gastado', itemStyle: { color: '#ef4444' } },
      { value: Math.max(0, saldo), name: 'Disponible', itemStyle: { color: '#22c55e' } }
    ];

    return {
      saldo,
      esSaldoPositivo,
      porcentajeDisponible,
      donutDataPresupuesto
    };
  }, [totalBudget, datosEnviados, datosBorrador]);

  return (
    <Col>
      <Card>
        <CardHeader className="d-flex border-dashed justify-content-between align-items-center">
          <CardTitle as="h5">Presupuesto Disponble</CardTitle>
          <Badge bg={saldoData.esSaldoPositivo ? "success" : "danger"} className={`bg-opacity-10 text-${saldoData.esSaldoPositivo ? "success" : "danger"}`}>
            {saldoData.esSaldoPositivo ? "A Favor" : "En Contra"}
          </Badge>
        </CardHeader>
        <CardBody>
          <div className="d-flex justify-content-between align-items-center text-nowrap">
            <div className="d-flex align-items-center">
            <div className="flex-grow-1">
              <DonutChartCustom data={saldoData.donutDataPresupuesto} porcentaje={saldoData.porcentajeDisponible} />
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
                <span style={{ color: saldoData.esSaldoPositivo ? '#22c55e' : '#ef4444' }}>
                  {saldoData.esSaldoPositivo ? '+' : ''}${saldoData.saldo.toFixed(2)}
                </span>
              </h3>
              <p className="mb-0 text-muted">
                <span>{saldoData.porcentajeDisponible.toFixed(1)}% disponible</span>
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </Col>
  );
});
SaldoCard.displayName = 'SaldoCard';

const EcomStats: React.FC<EcomStatsProps> = React.memo(({ 
  budgetData = [], 
  paquetesEnviadosData = {
    totalPaquetes: 0,
    totalPagado: 0,
    paquetes: []
  },
  selectedCompany
}) => {
  return (
    <Row xs={1} md={2} xxl={4}>
      <PresupuestoTotalCard budgetData={budgetData} selectedCompany={selectedCompany} />
      <PagosRealizadosCard paquetesEnviadosData={paquetesEnviadosData} />
      <PagosTransitoCard paquetesEnviadosData={paquetesEnviadosData} />
      <SaldoCard budgetData={budgetData} paquetesEnviadosData={paquetesEnviadosData} />
    </Row>
  )
});
EcomStats.displayName = 'EcomStats';

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