"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { InsumoDetail } from "../types";
import { Search, Star, Factory, Inbox } from "lucide-react";
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
      <div className="flex justify-between items-center mb-3">
        <div className="flex gap-2">
          <div className="relative" style={{ width: "300px" }}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar por orden o insumo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={filterExtra}
            onValueChange={(value: "all" | "extra" | "production") => setFilterExtra(value)}
          >
            <SelectTrigger style={{ width: "200px" }}>
              <SelectValue placeholder="Todos los insumos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los insumos</SelectItem>
              <SelectItem value="extra">Solo extras</SelectItem>
              <SelectItem value="production">Solo produccion</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-muted-foreground">
          Mostrando {filteredInsumos.length} de {insumos.length} insumos
        </div>
      </div>

      {/* Tabla */}
      <div className={`overflow-x-auto ${styles.tableWrapper}`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox />
              </TableHead>
              <TableHead>ID Orden</TableHead>
              <TableHead>Nombre Insumo</TableHead>
              <TableHead>Stock Utilizado</TableHead>
              <TableHead>Stock Restante</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Total Venta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInsumos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <div className="text-muted-foreground">No se encontraron insumos</div>
                </TableCell>
              </TableRow>
            ) : (
              filteredInsumos.map((insumo, index) => (
                <TableRow key={`${insumo.orderId}-${insumo.insumoName}-${index}`}>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell>
                    <span className="text-blue-500 font-semibold">
                      {insumo.orderNumber}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div
                        className={`${styles.insumoIcon} ${
                          insumo.isExtra
                            ? styles.insumoIconExtra
                            : styles.insumoIconProduction
                        } mr-3`}
                      >
                        {insumo.isExtra ? (
                          <Star
                            size={18}
                            style={{ color: "#2196f3" }}
                          />
                        ) : (
                          <Factory
                            size={18}
                            style={{ color: "#ff9800" }}
                          />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold">{insumo.insumoName}</div>
                        <small className="text-muted-foreground">
                          {insumo.isExtra ? "Insumo Extra" : "Insumo Produccion"}
                        </small>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="default"
                      className={`${styles.badgeStock} bg-cyan-500`}
                    >
                      {insumo.stockUsed.toFixed(2)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="default"
                      className={`${styles.badgeStock} ${
                        insumo.stockRemaining > 10
                          ? "bg-green-500"
                          : insumo.stockRemaining > 5
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                    >
                      {insumo.stockRemaining.toFixed(2)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {insumo.isExtra ? (
                      <Badge variant="default" className={`${styles.badgeType} bg-blue-500`}>
                        Extra
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className={styles.badgeType}
                      >
                        Produccion
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-green-500 font-bold" style={{ fontSize: "16px" }}>
                      ${insumo.totalVenta.toFixed(2)}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default InsumosTable;
