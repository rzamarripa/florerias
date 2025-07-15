import React from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Button, Card, CardBody, CardHeader, CardTitle, Col, Nav, NavItem, NavLink, ProgressBar, Row, Form } from 'react-bootstrap'
import { TbDownload, TbHome, TbSend2, TbSettings, TbUserCircle } from 'react-icons/tb'

import { ordersStatsData } from '../utils/data'
import { VisibilityBranch, VisibilityBrand } from '../services/dashboardPagosService'

const OrdersChart = dynamic(() => import('../utils/chart').then((mod) => mod.OrdersChart))

interface OrdersStaticsProps {
  visibilityStructure: {
    branches: VisibilityBranch[];
    brands: VisibilityBrand[];
  } | null;
  selectedCompany: string;
  selectedBranch: string;
  onBranchChange: (branchId: string) => void;
  branchBudget?: number; // Presupuesto de la sucursal seleccionada
}

const OrdersStatics: React.FC<OrdersStaticsProps> = ({ 
  visibilityStructure, 
  selectedCompany, 
  selectedBranch, 
  onBranchChange,
  branchBudget
}) => {
  // Filtrar sucursales y marcas basado en la compañía seleccionada
  const filteredBranches = visibilityStructure?.branches.filter(
    branch => branch.companyId === selectedCompany
  ) || [];

  const filteredBrands = visibilityStructure?.brands.filter(
    brand => brand.companyId === selectedCompany
  ) || [];

  // Crear opciones únicas combinando sucursal-marca
  const branchBrandOptions = filteredBranches.map(branch => {
    const brand = filteredBrands.find(b => b._id === branch.brandId);
    return {
      id: branch.brandId, // Usar brandId como ID
      displayName: `${branch.name} - ${brand?.name || 'Marca no encontrada'}`,
      branchId: branch._id,
      brandId: branch.brandId,
      branchName: branch.name,
      brandName: brand?.name || 'Marca no encontrada'
    };
  });

  return (
    <Row>
      <Col xs={12}>
        <Card>
          <CardHeader className="border-dashed card-tabs d-flex align-items-center">
            <div className="flex-grow-1 d-flex align-items-center gap-3">
              <CardTitle as="h4" className="mb-0">Estadisticas Totales</CardTitle>
              
              {/* Select de sucursales movido al header */}
              <Form.Select
                size="sm"
                value={selectedBranch}
                onChange={(e) => onBranchChange(e.target.value)}
                style={{ maxWidth: '250px' }}
                disabled={!selectedCompany}
              >
                <option value="">Todas las sucursales</option>
                {branchBrandOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.displayName}
                  </option>
                ))}
              </Form.Select>
            </div>
            
            <Nav variant="tabs" defaultActiveKey="monthly-ct" className="card-header-tabs nav-bordered">
              <NavItem>
                <NavLink eventKey="today-ct">
                  <TbHome className="d-md-none d-block" />
                  <span className="d-none d-md-block">Hoy</span>
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink eventKey="monthly-ct">
                  <TbUserCircle className="d-md-none d-block" />
                  <span className="d-none d-md-block">Mensual</span>
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink eventKey="annual-ct">
                  <TbSettings className="d-md-none d-block" />
                  <span className="d-none d-md-block">Anual</span>
                </NavLink>
              </NavItem>
            </Nav>
          </CardHeader>
          <CardBody className="p-0">
            <Row className="g-0">
              <Col xxl={8} className="border-end border-dashed">
                {/* Presupuesto de la sucursal dentro del área de la gráfica */}
                {selectedBranch && branchBudget !== undefined && (
                  <div className=" border-bottom border-dashed bg-light-subtle">
                    <h3 className="text-primary mb-0 text-center">
                      Presupuesto: ${branchBudget.toLocaleString()}
                    </h3>
                  </div>
                )}

                <OrdersChart />

              </Col>
              <Col xxl={4}>
                <div className="p-3 bg-light-subtle border-bottom border-dashed">
                  <Row>
                    <Col>
                      <h4 className="fs-sm mb-1">¿Te gustaria el reporte completo?</h4>
                      <small className="text-muted fs-xs mb-0">
                        Todos los pagos han sido entregados
                      </small>
                    </Col>
                    <Col xs="auto" className="align-self-center">
                      <Button
                        variant="default"
                        size="sm"
                        className="rounded-circle btn-icon"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        title="Descargar"
                      >
                        <TbDownload className="fs-xl" />
                      </Button>
                    </Col>
                  </Row>
                </div>
                <Row xs={1} md={2} xxl={2} className="g-1 p-1">

                  {ordersStatsData.map(({ value, valuePrefix, valueSuffix, percentage, percentageIcon, progress, title }, index) => (
                    <Col key={index}>
                      <Card className="rounded-0 border shadow-none border-dashed mb-0">
                        <CardBody>
                          <div className="mb-3 d-flex justify-content-between align-items-center">
                            <h5 className="fs-xl mb-0">
                              {valuePrefix && valuePrefix}
                              {value.toLocaleString()}
                              {valueSuffix && <small> {valueSuffix}</small>}
                            </h5>
                            <span>
                              {percentage}% {percentageIcon}
                            </span>
                          </div>
                          <p className="text-muted mb-2">
                            <span>{title}</span>
                          </p>
                          <ProgressBar now={progress} variant="secondary" style={{ height: '0.25rem' }}  aria-label={title} />
                        </CardBody>
                      </Card>
                    </Col>
                  ))}

                </Row>
                <div className="text-center my-3">
                  <Link href="/chat" className="link-reset text-decoration-underline fw-semibold link-offset-3">
                    Ver todos los Reportes <TbSend2 size={13} />
                  </Link>
                </div>
              </Col>
            </Row>
          </CardBody>
        </Card>
      </Col>
    </Row>
  )
}

export default OrdersStatics