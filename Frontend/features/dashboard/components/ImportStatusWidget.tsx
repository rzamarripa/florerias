"use client";

import { CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, Card, Spinner, Table } from "react-bootstrap";
import { formatMoney } from "../../../utils";
import { getImportStatus } from "../services/dashboardService";
import { ImportStatusItem } from "../types";

const WEEK_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const ImportStatusWidget = () => {
  const [data, setData] = useState<ImportStatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const res = await getImportStatus();
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message || "No se pudieron cargar los datos.");
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <Card>
      <Card.Body>
        <h4 className="card-title mb-4">Estatus de Importaciones Semanal</h4>

        {loading && (
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
          </div>
        )}

        {error && <Alert variant="danger">{error}</Alert>}

        {!loading && !error && (
          <Table responsive striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Razón Social</th>
                <th>Cuenta Bancaria</th>
                <th>Saldo Actual</th>
                {WEEK_DAYS.map((day) => (
                  <th key={day} className="text-center">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.accountId}>
                  <td>{item.companyName}</td>
                  <td>
                    {item.accountNumber} ({item.bankName})
                  </td>
                  <td className="text-end">
                    {formatMoney(item.currentBalance)}
                  </td>
                  {item.dailyStatus.map((status, index) => (
                    <td key={index} className="text-center">
                      {status ? (
                        <CheckCircle size={20} className="text-success" />
                      ) : (
                        <XCircle size={20} className="text-danger" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
};

export default ImportStatusWidget;
