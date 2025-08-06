import React from "react";
import { Button, Table, Badge, Card } from "react-bootstrap";

// Esqueleto del componente de tabla de pagos en efectivo embebidos
// Props: pagos (array), onAuthorize, onReject, packageStatus
interface CashPaymentsInPackageTableProps {
  pagos: any[];
  onAuthorize: (pagoId: string) => void;
  onReject: (pagoId: string) => void;
  loading?: boolean;
  packageStatus?: string;
  showActions?: boolean;
}

// Estilos para mostrar borde solo en hover (igual que en la tabla de facturas)
const actionButtonStyles = `
    .action-button-hover-border {
        border: none !important;
        background-color: transparent !important;
    }
    .action-button-hover-border:hover {
        border: 2px solid !important;
        background-color: transparent !important;
    }
    .action-button-hover-border.btn-outline-success:hover {
        border-color: #198754 !important;
        color: #198754 !important;
    }
    .action-button-hover-border.btn-outline-danger:hover {
        border-color: #dc3545 !important;
        color: #dc3545 !important;
    }
`;

// Utilidad para extraer el número de un posible objeto Decimal128 o string
function getNumber(val: any): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "string") return Number(val);
  if (typeof val === "object" && "$numberDecimal" in val)
    return Number(val.$numberDecimal);
  return Number(val);
}

const CashPaymentsInPackageTable: React.FC<CashPaymentsInPackageTableProps> = ({
  pagos,
  onAuthorize,
  onReject,
  loading,
  packageStatus,
  showActions = true,
}) => {
  // Función para calcular el total de importeAPagar
  const calcularTotalImporteAPagar = () =>
    pagos.reduce((sum, p) => sum + getNumber(p.importeAPagar), 0);
  // Función para calcular el total de importePagado
  const calcularTotalImportePagado = () =>
    pagos.reduce((sum, p) => sum + getNumber(p.importePagado), 0);

  return (
    <div>
      <style jsx>{actionButtonStyles}</style>

      {pagos.length === 0 ? (
        <Card className="shadow-sm border-0">
          <Card.Body className="text-center py-5">
            <div className="text-muted">
              <i className="bi bi-cash-coin" style={{ fontSize: "3rem" }}></i>
              <p className="mt-3 mb-0">
                No hay pagos en efectivo en este paquete
              </p>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <Card className="shadow-sm border-0">
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th>#</th>
                  <th>Concepto de Gasto</th>
                  <th>Descripción</th>
                  <th>Estatus</th>
                  <th>Estatus Aut.</th>
                  <th className="text-center">Importe a pagar</th>
                  <th className="text-center">Total pagado</th>
                  {showActions && <th className="text-center">Acción</th>}
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago, idx) => (
                  <tr
                    key={pago._id}
                    className={idx % 2 === 1 ? "bg-pink bg-opacity-25" : ""}
                  >
                    <td>{idx + 1}</td>
                    <td>
                      <div className="fw-bold">
                        {pago.expenseConcept?.name ||
                          "Concepto no especificado"}
                      </div>
                      <div>
                        <Badge bg="secondary" className="me-1">
                          Pago {idx + 1}
                        </Badge>
                      </div>
                    </td>
                    <td>
                      <span className="text-muted">
                        {pago.description || "Sin descripción"}
                      </span>
                    </td>
                    <td>
                      {pago.pagoRechazado === true ? (
                        <Badge className="bg-danger bg-opacity-10 text-danger">
                          Rechazado
                        </Badge>
                      ) : (
                        <Badge className="bg-success bg-opacity-10 text-success">
                          Vigente
                        </Badge>
                      )}
                    </td>
                    <td>
                      <span className="text-primary">
                        {pago.autorizada === null
                          ? "Pendiente"
                          : pago.autorizada === true
                          ? "Autorizado"
                          : "Pago Rechazado"}
                      </span>
                    </td>
                    <td className="text-end">
                      $
                      {getNumber(pago.importeAPagar).toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="text-end">
                      $
                      {getNumber(pago.importePagado).toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    {showActions && (
                      <td className="text-center">
                        <div className="d-flex justify-content-center align-items-center">
                          <Button
                            variant="outline-success"
                            size="sm"
                            className="fw-bold text-success me-1 action-button-hover-border"
                            title="Autorizar pago"
                            onClick={() => onAuthorize(pago._id)}
                            disabled={
                              loading ||
                              pago.autorizada === true ||
                              packageStatus !== "Borrador"
                            }
                          >
                            Sí{" "}
                            <span
                              style={{ fontWeight: "bold", fontSize: "1.1em" }}
                            >
                              ✓
                            </span>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="fw-bold text-danger me-1 action-button-hover-border"
                            title="Rechazar pago"
                            onClick={() => onReject(pago._id)}
                            disabled={
                              loading ||
                              pago.autorizada === false ||
                              packageStatus !== "Borrador"
                            }
                          >
                            No{" "}
                            <span
                              style={{ fontWeight: "bold", fontSize: "1.1em" }}
                            >
                              ✗
                            </span>
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {/* Fila de totales - exactamente igual que en la tabla de facturas */}
                <tr className="fw-bold text-left">
                  <td className="text-end" colSpan={5}>
                    Total a pagar
                  </td>
                  <td className="text-end">
                    $
                    {calcularTotalImporteAPagar().toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="text-end">
                    $
                    {calcularTotalImportePagado().toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  {showActions && <td></td>}
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default CashPaymentsInPackageTable;
