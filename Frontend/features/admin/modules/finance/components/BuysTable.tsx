"use client";

import React, { useEffect, useState } from "react";
import { Table, Spinner } from "react-bootstrap";
import { financeService } from "../services/finance";
import { FinanceFilters, Buy } from "../types";
import { toast } from "react-toastify";

interface BuysTableProps {
  filters: FinanceFilters;
}

const BuysTable: React.FC<BuysTableProps> = ({ filters }) => {
  const [buys, setBuys] = useState<Buy[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    console.log("BuysTable useEffect - filters:", filters);
    loadBuys();
  }, [filters]);

  const loadBuys = async () => {
    try {
      setLoading(true);
      console.log("Loading buys with filters:", filters);
      const response = await financeService.getBuysByBranch(filters);
      console.log("Response received:", response);
      if (response.data) {
        setBuys(response.data);
        console.log("Buys set to state:", response.data);
      } else {
        console.log("No data in response");
        setBuys([]);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar compras");
      console.error("Error loading buys:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-3">Cargando compras...</p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div
        className="card border-0 shadow-sm"
        style={{ borderRadius: "15px" }}
      >
        <div className="card-body p-0">
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead style={{ background: "#f8f9fa" }}>
                <tr>
                  <th className="px-4 py-3 fw-semibold text-muted">No.</th>
                  <th className="px-4 py-3 fw-semibold text-muted">
                    CONCEPTO
                  </th>
                  <th className="px-4 py-3 fw-semibold text-muted">
                    DESCRIPCIÓN
                  </th>
                  <th className="px-4 py-3 fw-semibold text-muted">
                    SUCURSAL
                  </th>
                  <th className="px-4 py-3 fw-semibold text-muted">
                    FECHA PAGO
                  </th>
                  <th className="px-4 py-3 fw-semibold text-muted">
                    FORMA PAGO
                  </th>
                  <th className="px-4 py-3 fw-semibold text-muted">
                    REGISTRADO POR
                  </th>
                  <th className="px-4 py-3 fw-semibold text-muted text-end">
                    IMPORTE
                  </th>
                </tr>
              </thead>
              <tbody>
                {buys.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-5 text-muted">
                      No se encontraron compras
                    </td>
                  </tr>
                ) : (
                  buys.map((buy, index) => (
                    <tr
                      key={buy._id}
                      style={{ borderBottom: "1px solid #f1f3f5" }}
                    >
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3">{buy.concept}</td>
                      <td className="px-4 py-3">
                        <span className="text-muted" style={{ fontSize: "13px" }}>
                          {buy.description || "Sin descripción"}
                        </span>
                      </td>
                      <td className="px-4 py-3">{buy.branchName}</td>
                      <td className="px-4 py-3">
                        {formatDate(buy.paymentDate)}
                      </td>
                      <td className="px-4 py-3">{buy.paymentMethod}</td>
                      <td className="px-4 py-3">{buy.userName}</td>
                      <td className="px-4 py-3 text-end fw-semibold">
                        {formatCurrency(buy.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuysTable;
