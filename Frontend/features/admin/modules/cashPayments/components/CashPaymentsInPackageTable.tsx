import React from "react";
import { Button, Table, Badge, Card } from "react-bootstrap";
import { FiTrash2 } from "react-icons/fi";

// Esqueleto del componente de tabla de pagos en efectivo embebidos
// Props: pagos (array), onAuthorize, onReject, packageStatus
interface CashPaymentsInPackageTableProps {
  pagos: any[];
  onAuthorize: (pagoId: string) => void;
  onReject: (pagoId: string) => void;
  onRemove?: (pagoId: string) => void;
  canRemovePayment?: (pago: any, isTemporary?: boolean) => boolean;
  loading?: boolean;
  packageStatus?: string;
  showActions?: boolean;
  showRemoveButton?: boolean;
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
  onRemove,
  canRemovePayment,
  loading,
  packageStatus,
  showActions = true,
  showRemoveButton = false,
}) => {
  // Función para calcular el total de importeAPagar
  const calcularTotalImporteAPagar = () =>
    pagos.reduce((sum, p) => sum + getNumber(p.importeAPagar), 0);

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
            <div className="table-responsive">
              <Table responsive className="mb-0 align-middle w-100 table-hover">
                <thead className="bg-light">
                  <tr>
                    <th style={{ width: "5%" }} className="text-center">
                      #
                    </th>
                    <th style={{ width: "25%" }}>Concepto de Gasto</th>
                    <th style={{ width: "20%" }}>Descripción</th>
                    <th style={{ width: "15%" }}>Estatus</th>
                    {showActions && (
                      <th style={{ width: "15%" }}>Estatus Aut.</th>
                    )}
                    <th className="text-end" style={{ width: "15%" }}>
                      Importe a pagar
                    </th>
                    {showActions && (
                      <th className="text-center" style={{ width: "15%" }}>
                        Acción
                      </th>
                    )}
                    {showRemoveButton && (
                      <th className="text-center" style={{ width: "10%" }}>
                        Eliminar
                      </th>
                    )}
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
                      {showActions && (
                        <td>
                          <span className="text-primary">
                            {pago.autorizada === null
                              ? "Pendiente"
                              : pago.autorizada === true
                              ? "Autorizado"
                              : "Pago Rechazado"}
                          </span>
                        </td>
                      )}

                      <td className="text-end">
                        $
                        {getNumber(pago.importeAPagar).toLocaleString("es-MX", {
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
                                style={{
                                  fontWeight: "bold",
                                  fontSize: "1.1em",
                                }}
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
                                (pago.autorizada === false &&
                                  pago.pagoRechazado === true) ||
                                packageStatus !== "Borrador"
                              }
                            >
                              No{" "}
                              <span
                                style={{
                                  fontWeight: "bold",
                                  fontSize: "1.1em",
                                }}
                              >
                                ✗
                              </span>
                            </Button>
                          </div>
                        </td>
                      )}
                      {showRemoveButton && (
                        <td className="text-center align-middle">
                          {(() => {
                            const isTemporary = pago._id?.startsWith("temp_");
                            const canRemove =
                              isTemporary ||
                              (canRemovePayment &&
                                canRemovePayment(pago, false));

                            return canRemove ? (
                              <button
                                className="btn btn-light btn-icon btn-sm rounded-circle"
                                onClick={() => onRemove && onRemove(pago._id)}
                                title={
                                  isTemporary
                                    ? "Eliminar pago temporal"
                                    : "Eliminar pago"
                                }
                                type="button"
                                tabIndex={0}
                              >
                                <FiTrash2 size={16} />
                              </button>
                            ) : (
                              <button
                                className="btn btn-light btn-icon btn-sm rounded-circle"
                                disabled
                                title="No se puede eliminar este pago"
                                type="button"
                                tabIndex={-1}
                                style={{ opacity: 0.3 }}
                              >
                                <FiTrash2 size={16} />
                              </button>
                            );
                          })()}
                        </td>
                      )}
                    </tr>
                  ))}
                  {/* Fila de totales - exactamente igual que en la tabla de facturas */}
                  <tr className="fw-bold text-left bg-light">
                    <td
                      className="text-end"
                      colSpan={
                        showActions && showRemoveButton
                          ? 6
                          : showActions
                          ? 5
                          : showRemoveButton
                          ? 5
                          : 4
                      }
                    >
                      Total a pagar
                    </td>
                    <td className="text-end fw-bold">
                      $
                      {calcularTotalImporteAPagar().toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    {showActions && <td></td>}
                    {showRemoveButton && <td></td>}
                  </tr>
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default CashPaymentsInPackageTable;
