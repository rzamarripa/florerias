"use client";

import React, { useState } from "react";
import { Table, Badge, Form, InputGroup } from "react-bootstrap";
import { InsumoDetail } from "../types";
import styles from "./InsumosTable.module.css";

interface InsumosTableProps {
  insumos: InsumoDetail[];
}

const InsumosTable: React.FC<InsumosTableProps> = ({ insumos }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterExtra, setFilterExtra] = useState<"all" | "extra" | "production">("all");

  // Filtrar insumos
  const filteredInsumos = insumos.filter((insumo) => {
    const matchesSearch =
      insumo.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insumo.insumoName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterExtra === "all" ||
      (filterExtra === "extra" && insumo.isExtra) ||
      (filterExtra === "production" && !insumo.isExtra);

    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      {/* Filtros */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex gap-2">
          <InputGroup style={{ width: "300px" }}>
            <InputGroup.Text>
              <i className="fa fa-search"></i>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Buscar por orden o insumo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchBar}
            />
          </InputGroup>

          <Form.Select
            value={filterExtra}
            onChange={(e) => setFilterExtra(e.target.value as any)}
            style={{ width: "200px" }}
            className={styles.filterSelect}
          >
            <option value="all">Todos los insumos</option>
            <option value="extra">Solo extras</option>
            <option value="production">Solo producción</option>
          </Form.Select>
        </div>

        <div className="text-muted">
          Mostrando {filteredInsumos.length} de {insumos.length} insumos
        </div>
      </div>

      {/* Tabla */}
      <div className={`table-responsive ${styles.tableWrapper}`}>
        <Table hover className="mb-0">
          <thead>
            <tr>
              <th>
                <label className="form-check-label">
                  <input type="checkbox" className="form-check-input" />
                </label>
              </th>
              <th>ID Orden</th>
              <th>Nombre Insumo</th>
              <th>Stock Utilizado</th>
              <th>Stock Restante</th>
              <th>Tipo</th>
              <th className="text-end">Total Venta</th>
            </tr>
          </thead>
          <tbody>
            {filteredInsumos.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyState}>
                  <i className="fa fa-inbox"></i>
                  <div>No se encontraron insumos</div>
                </td>
              </tr>
            ) : (
              filteredInsumos.map((insumo, index) => (
                <tr key={`${insumo.orderId}-${insumo.insumoName}-${index}`}>
                  <td>
                    <label className="form-check-label">
                      <input type="checkbox" className="form-check-input" />
                    </label>
                  </td>
                  <td>
                    <span className="text-primary fw-semibold">
                      {insumo.orderNumber}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <div
                        className={`${styles.insumoIcon} ${
                          insumo.isExtra
                            ? styles.insumoIconExtra
                            : styles.insumoIconProduction
                        }`}
                      >
                        <i
                          className={`fa ${
                            insumo.isExtra ? "fa-star" : "fa-industry"
                          }`}
                          style={{
                            color: insumo.isExtra ? "#2196f3" : "#ff9800",
                            fontSize: "18px",
                          }}
                        ></i>
                      </div>
                      <div>
                        <div className="fw-semibold">{insumo.insumoName}</div>
                        <small className="text-muted">
                          {insumo.isExtra ? "Insumo Extra" : "Insumo Producción"}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge
                      bg="info"
                      className={styles.badgeStock}
                    >
                      {insumo.stockUsed.toFixed(2)}
                    </Badge>
                  </td>
                  <td>
                    <Badge
                      bg={insumo.stockRemaining > 10 ? "success" : insumo.stockRemaining > 5 ? "warning" : "danger"}
                      className={styles.badgeStock}
                    >
                      {insumo.stockRemaining.toFixed(2)}
                    </Badge>
                  </td>
                  <td>
                    {insumo.isExtra ? (
                      <Badge bg="primary" className={styles.badgeType}>
                        Extra
                      </Badge>
                    ) : (
                      <Badge
                        bg="warning"
                        text="dark"
                        className={styles.badgeType}
                      >
                        Producción
                      </Badge>
                    )}
                  </td>
                  <td className="text-end">
                    <span className="text-success fw-bold" style={{ fontSize: "16px" }}>
                      ${insumo.totalVenta.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default InsumosTable;
