import React from "react";
import { Alert, Table } from "react-bootstrap";
import { BankMovement } from "../types/validation";
import { formatMoney } from "@/utils";
import { formatDateTime } from "@/utils/dateUtils";

interface MovementsTableProps {
  previewHeaders: string[];
  previewData: BankMovement[];
}

const MovementsTable: React.FC<MovementsTableProps> = ({
  previewHeaders,
  previewData,
}) => {
  if (previewData.length === 0) {
    return null;
  }

  return (
    <Table striped bordered responsive size="sm">
      <thead>
        <tr>
          {previewHeaders.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {previewData.map((row, idx) => (
          <tr key={idx}>
            <td>{idx + 1}</td>
            <td>{formatDateTime(row.fecha)}</td>
            <td>{row.recibo}</td>
            <td>{row.concepto}</td>
            <td className="text-end">{formatMoney(row.cargo)}</td>
            <td className="text-end">{formatMoney(row.abono)}</td>
            <td className="text-end">{formatMoney(row.saldo)}</td>
            <td className="text-end">{formatMoney(row.saldoCalculado || 0)}</td>
            <td>
              {row.advertencia && (
                <Alert variant="warning" className="p-1 m-0">
                  {row.advertencia}
                </Alert>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default MovementsTable;
