"use client";

import React, { useState, useEffect } from "react";
import { Tabs, Tab, Button } from "react-bootstrap";
import { Download } from "lucide-react";
import DateFilters from "./components/DateFilters";
import SalesStats from "./components/SalesStats";
import NewSalesTable from "./components/NewSalesTable";
import CreditSalesTable from "./components/CreditSalesTable";
import ExchangeSalesTable from "./components/ExchangeSalesTable";
import CancelledSalesTable from "./components/CancelledSalesTable";
import PendingPaymentsTable from "./components/PendingPaymentsTable";
import { paymentMethodsService } from "../payment-methods/services/paymentMethods";
import { salesService } from "./services/sales";
import { toast } from "react-toastify";

const SalesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("nuevas");
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [dateFilters, setDateFilters] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    viewMode: "dia" as "dia" | "semana" | "mes",
    branchId: undefined as string | undefined,
  });
  const [creditPaymentMethodId, setCreditPaymentMethodId] = useState<
    string | undefined
  >(undefined);
  const [exporting, setExporting] = useState<boolean>(false);

  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        const response = await paymentMethodsService.getAllPaymentMethods({
          status: true,
        });
        if (response.data) {
          // Buscar el método de pago "Tarjeta de Crédito" (o variantes)
          const creditMethod = response.data.find(
            (pm) =>
              pm.name.toLowerCase().includes("crédito") ||
              pm.name.toLowerCase().includes("credito") ||
              pm.name.toLowerCase().includes("tarjeta de crédito") ||
              pm.name.toLowerCase().includes("tarjeta de credito")
          );
          if (creditMethod) {
            setCreditPaymentMethodId(creditMethod._id);
          }
        }
      } catch (error) {
        console.error("Error loading payment methods:", error);
      }
    };

    loadPaymentMethods();
  }, []);

  const handleSearch = (filters: {
    startDate: string;
    endDate: string;
    viewMode: "dia" | "semana" | "mes";
    branchId?: string;
  }) => {
    setDateFilters({
      ...filters,
      branchId: filters.branchId || undefined,
    });
    setHasSearched(true);
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);

      // Crear el nombre del archivo con fecha
      const startDate = new Date(dateFilters.startDate).toLocaleDateString(
        "es-MX"
      );
      const endDate = new Date(dateFilters.endDate).toLocaleDateString("es-MX");
      const fileName = `ventas_detalladas_${startDate}_${endDate}.xlsx`;

      // Obtener los datos según la pestaña activa
      const { salesData, productsData } = await getExportData();

      // Crear el archivo Excel
      const XLSX = await import("xlsx");
      const workbook = XLSX.utils.book_new();

      // Hoja 1: Resumen de Ventas
      const salesWorksheet = XLSX.utils.json_to_sheet(salesData);
      XLSX.utils.book_append_sheet(workbook, salesWorksheet, "Resumen Ventas");

      // Hoja 2: Detalle de Productos
      const productsWorksheet = XLSX.utils.json_to_sheet(productsData);
      XLSX.utils.book_append_sheet(
        workbook,
        productsWorksheet,
        "Productos Vendidos"
      );

      // Hoja 3: Resumen Ejecutivo
      const summaryData = generateSummaryData(salesData, productsData);
      const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(
        workbook,
        summaryWorksheet,
        "Resumen Ejecutivo"
      );

      // Configurar columnas para mejor visualización
      const salesCols = [
        { wch: 15 }, // Folio
        { wch: 25 }, // Cliente
        { wch: 15 }, // Teléfono
        { wch: 25 }, // Email
        { wch: 15 }, // Canal
        { wch: 12 }, // Fecha Pedido
        { wch: 12 }, // Fecha Entrega
        { wch: 12 }, // Estatus
        { wch: 20 }, // Método Pago
        { wch: 12 }, // Subtotal
        { wch: 10 }, // Descuento
        { wch: 12 }, // Total
        { wch: 10 }, // Anticipo
        { wch: 10 }, // Pagado
        { wch: 10 }, // Cambio
        { wch: 15 }, // Saldo
        { wch: 12 }, // Tipo Envío
        { wch: 8 }, // Anónimo
        { wch: 10 }, // Venta Rápida
      ];

      const productsCols = [
        { wch: 15 }, // Folio
        { wch: 25 }, // Cliente
        { wch: 30 }, // Producto
        { wch: 10 }, // Cantidad
        { wch: 12 }, // Precio Unit
        { wch: 12 }, // Total
        { wch: 15 }, // Fecha Pedido
        { wch: 12 }, // Estatus
      ];

      const summaryCols = [
        { wch: 40 }, // MÉTRICA
        { wch: 30 }, // VALOR
      ];

      salesWorksheet["!cols"] = salesCols;
      productsWorksheet["!cols"] = productsCols;
      summaryWorksheet["!cols"] = summaryCols;

      // Agregar grupos/outlines para hacer expandible/colapsable
      if (salesData.length > 0) {
        salesWorksheet["!outline"] = {
          summaryBelow: false,
          summaryRight: false,
        };

        // Agregar subtotales por cliente en la hoja de productos
        if (productsData.length > 0) {
          // Ordenar productos por cliente y folio
          const sortedProducts = productsData.sort((a, b) => {
            if (a.Cliente !== b.Cliente) {
              return a.Cliente.localeCompare(b.Cliente);
            }
            return a.Folio.localeCompare(b.Folio);
          });

          // Crear nueva hoja con subtotales
          const productsWithSubtotals: any[] = [];
          let currentClient = "";
          let clientTotal = 0;
          let clientCount = 0;

          sortedProducts.forEach((product, index) => {
            if (product.Cliente !== currentClient) {
              // Agregar subtotal del cliente anterior
              if (currentClient !== "") {
                productsWithSubtotals.push({
                  Folio: "",
                  Cliente: `SUBTOTAL ${currentClient}`,
                  Producto: "",
                  Cantidad: clientCount,
                  "Precio Unitario": "",
                  "Total Producto": clientTotal,
                  "Fecha Pedido": "",
                  "Estatus Venta": "",
                  Tipo: "SUBTOTAL",
                  "Canal de Venta": "",
                  "Método de Pago": "",
                });
              }

              // Iniciar nuevo cliente
              currentClient = product.Cliente;
              clientTotal = 0;
              clientCount = 0;
            }

            productsWithSubtotals.push(product);
            clientTotal += product["Total Producto"] || 0;
            clientCount += product.Cantidad || 0;
          });

          // Agregar último subtotal
          if (currentClient !== "") {
            productsWithSubtotals.push({
              Folio: "",
              Cliente: `SUBTOTAL ${currentClient}`,
              Producto: "",
              Cantidad: clientCount,
              "Precio Unitario": "",
              "Total Producto": clientTotal,
              "Fecha Pedido": "",
              "Estatus Venta": "",
              Tipo: "SUBTOTAL",
              "Canal de Venta": "",
              "Método de Pago": "",
            });
          }

          // Agregar total general
          const grandTotal = productsData.reduce(
            (sum, product) => sum + (product["Total Producto"] || 0),
            0
          );
          const grandCount = productsData.reduce(
            (sum, product) => sum + (product.Cantidad || 0),
            0
          );

          productsWithSubtotals.push({
            Folio: "",
            Cliente: "TOTAL GENERAL",
            Producto: "",
            Cantidad: grandCount,
            "Precio Unitario": "",
            "Total Producto": grandTotal,
            "Fecha Pedido": "",
            "Estatus Venta": "",
            Tipo: "TOTAL",
            "Canal de Venta": "",
            "Método de Pago": "",
          });

          // Recrear la hoja de productos con subtotales
          const newProductsWorksheet = XLSX.utils.json_to_sheet(
            productsWithSubtotals
          );
          newProductsWorksheet["!cols"] = productsCols;
          newProductsWorksheet["!outline"] = {
            summaryBelow: false,
            summaryRight: false,
          };

          // Reemplazar la hoja de productos
          workbook.Sheets["Productos Vendidos"] = newProductsWorksheet;
        }
      }

      // Descargar el archivo
      XLSX.writeFile(workbook, fileName);

      toast.success("Archivo Excel detallado exportado exitosamente");
    } catch (error) {
      console.error("Error al exportar:", error);
      toast.error("Error al exportar el archivo Excel");
    } finally {
      setExporting(false);
    }
  };

  const generateSummaryData = (salesData: any[], productsData: any[]) => {
    const summary: any[] = [];

    // Encabezado del reporte
    summary.push({ MÉTRICA: "REPORTE DE VENTAS DETALLADO", VALOR: "" });
    summary.push({
      MÉTRICA: "Fecha de Generación",
      VALOR: new Date().toLocaleDateString("es-MX"),
    });
    summary.push({
      MÉTRICA: "Período",
      VALOR: `${dateFilters.startDate} - ${dateFilters.endDate}`,
    });
    summary.push({ MÉTRICA: "", VALOR: "" });

    // Estadísticas generales
    const totalVentas = salesData.length;
    const totalIngresos = salesData.reduce(
      (sum, sale) => sum + (sale.Total || 0),
      0
    );
    const totalProductos = productsData.reduce(
      (sum, product) => sum + (product.Cantidad || 0),
      0
    );
    const ticketPromedio = totalVentas > 0 ? totalIngresos / totalVentas : 0;

    summary.push({ MÉTRICA: "ESTADÍSTICAS GENERALES", VALOR: "" });
    summary.push({ MÉTRICA: "Total de Ventas", VALOR: totalVentas });
    summary.push({
      MÉTRICA: "Total de Ingresos",
      VALOR: `$${totalIngresos.toFixed(2)}`,
    });
    summary.push({
      MÉTRICA: "Total de Productos Vendidos",
      VALOR: totalProductos,
    });
    summary.push({
      MÉTRICA: "Ticket Promedio",
      VALOR: `$${ticketPromedio.toFixed(2)}`,
    });
    summary.push({ MÉTRICA: "", VALOR: "" });

    // Análisis por canal de venta
    const canalesVenta = salesData.reduce((acc, sale) => {
      const canal = sale["Canal de Venta"] || "Sin especificar";
      if (!acc[canal]) {
        acc[canal] = { ventas: 0, ingresos: 0 };
      }
      acc[canal].ventas++;
      acc[canal].ingresos += sale.Total || 0;
      return acc;
    }, {} as any);

    summary.push({ MÉTRICA: "ANÁLISIS POR CANAL DE VENTA", VALOR: "" });
    Object.entries(canalesVenta).forEach(([canal, data]: [string, any]) => {
      summary.push({ MÉTRICA: `${canal} - Ventas`, VALOR: data.ventas });
      summary.push({
        MÉTRICA: `${canal} - Ingresos`,
        VALOR: `$${data.ingresos.toFixed(2)}`,
      });
    });
    summary.push({ MÉTRICA: "", VALOR: "" });

    // Análisis por estatus
    const estatusVentas = salesData.reduce((acc, sale) => {
      const estatus = sale.Estatus || "Sin especificar";
      if (!acc[estatus]) {
        acc[estatus] = { ventas: 0, ingresos: 0 };
      }
      acc[estatus].ventas++;
      acc[estatus].ingresos += sale.Total || 0;
      return acc;
    }, {} as any);

    summary.push({ MÉTRICA: "ANÁLISIS POR ESTATUS", VALOR: "" });
    Object.entries(estatusVentas).forEach(([estatus, data]: [string, any]) => {
      summary.push({ MÉTRICA: `${estatus} - Ventas`, VALOR: data.ventas });
      summary.push({
        MÉTRICA: `${estatus} - Ingresos`,
        VALOR: `$${data.ingresos.toFixed(2)}`,
      });
    });
    summary.push({ MÉTRICA: "", VALOR: "" });

    // Top 5 clientes por ingresos
    const clientesIngresos = salesData.reduce((acc, sale) => {
      const cliente = sale.Cliente || "Sin nombre";
      if (!acc[cliente]) {
        acc[cliente] = 0;
      }
      acc[cliente] += sale.Total || 0;
      return acc;
    }, {} as any);

    const topClientes = Object.entries(clientesIngresos)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5);

    summary.push({ MÉTRICA: "TOP 5 CLIENTES POR INGRESOS", VALOR: "" });
    topClientes.forEach(([cliente, ingresos], index) => {
      summary.push({
        MÉTRICA: `${index + 1}. ${cliente}`,
        VALOR: `$${(ingresos as number).toFixed(2)}`,
      });
    });
    summary.push({ MÉTRICA: "", VALOR: "" });

    // Top 5 productos más vendidos
    const productosVendidos = productsData.reduce((acc, product) => {
      const producto = product.Producto || "Sin especificar";
      if (!acc[producto]) {
        acc[producto] = { cantidad: 0, ingresos: 0 };
      }
      acc[producto].cantidad += product.Cantidad || 0;
      acc[producto].ingresos += product["Total Producto"] || 0;
      return acc;
    }, {} as any);

    const topProductos = Object.entries(productosVendidos)
      .sort(([, a], [, b]) => (b as any).cantidad - (a as any).cantidad)
      .slice(0, 5);

    summary.push({ MÉTRICA: "TOP 5 PRODUCTOS MÁS VENDIDOS", VALOR: "" });
    topProductos.forEach(([producto, data], index) => {
      const productData = data as any;
      summary.push({
        MÉTRICA: `${index + 1}. ${producto}`,
        VALOR: `${
          productData.cantidad
        } unidades - $${productData.ingresos.toFixed(2)}`,
      });
    });

    return summary;
  };

  const getExportData = async () => {
    try {
      let response;

      switch (activeTab) {
        case "nuevas":
          response = await salesService.getNewSales({
            startDate: dateFilters.startDate,
            endDate: dateFilters.endDate,
            branchId: dateFilters.branchId,
          });
          break;
        case "credito":
          response = await salesService.getCreditSales({
            startDate: dateFilters.startDate,
            endDate: dateFilters.endDate,
            branchId: dateFilters.branchId,
            creditPaymentMethodId,
          });
          break;
        case "intercambio":
          response = await salesService.getExchangeSales({
            startDate: dateFilters.startDate,
            endDate: dateFilters.endDate,
            branchId: dateFilters.branchId,
          });
          break;
        case "canceladas":
          response = await salesService.getCancelledSales({
            startDate: dateFilters.startDate,
            endDate: dateFilters.endDate,
            branchId: dateFilters.branchId,
          });
          break;
        case "pendientes":
          response = await salesService.getPendingPayments({
            startDate: dateFilters.startDate,
            endDate: dateFilters.endDate,
            branchId: dateFilters.branchId,
          });
          break;
        default:
          return { salesData: [], productsData: [] };
      }

      if (response.data) {
        // Datos de resumen de ventas
        const salesData = response.data.map((sale: any) => ({
          Folio: sale.orderNumber || sale._id,
          Cliente: sale.clientInfo?.name || "Sin nombre",
          Teléfono: sale.clientInfo?.phone || "",
          Email: sale.clientInfo?.email || "",
          "Canal de Venta": sale.salesChannel,
          "Fecha Pedido": new Date(sale.createdAt).toLocaleDateString("es-MX"),
          "Fecha Entrega": sale.deliveryData?.deliveryDateTime
            ? new Date(sale.deliveryData.deliveryDateTime).toLocaleDateString(
                "es-MX"
              )
            : "",
          Estatus: sale.status,
          "Método de Pago":
            typeof sale.paymentMethod === "string"
              ? sale.paymentMethod
              : sale.paymentMethod?.name || "",
          Subtotal: sale.subtotal,
          Descuento: sale.discount,
          Total: sale.total,
          Anticipo: sale.advance,
          Pagado: sale.paidWith,
          Cambio: sale.change,
          "Saldo Pendiente": sale.remainingBalance,
          "Tipo de Envío": sale.shippingType,
          Anónimo: sale.anonymous ? "Sí" : "No",
          "Venta Rápida": sale.quickSale ? "Sí" : "No",
        }));

        // Datos detallados de productos vendidos
        const productsData: any[] = [];

        response.data.forEach((sale: any) => {
          if (sale.items && sale.items.length > 0) {
            sale.items.forEach((item: any) => {
              productsData.push({
                Folio: sale.orderNumber || sale._id,
                Cliente: sale.clientInfo?.name || "Sin nombre",
                Producto: item.isProduct
                  ? item.productName
                  : `Servicio: ${item.productName}`,
                Cantidad: item.quantity,
                "Precio Unitario": item.unitPrice,
                "Total Producto": item.amount,
                "Fecha Pedido": new Date(sale.createdAt).toLocaleDateString(
                  "es-MX"
                ),
                "Estatus Venta": sale.status,
                Tipo: item.isProduct ? "Producto" : "Servicio",
                "Canal de Venta": sale.salesChannel,
                "Método de Pago":
                  typeof sale.paymentMethod === "string"
                    ? sale.paymentMethod
                    : sale.paymentMethod?.name || "",
              });
            });
          } else {
            // Si no hay items, agregar una fila indicando que no hay productos
            productsData.push({
              Folio: sale.orderNumber || sale._id,
              Cliente: sale.clientInfo?.name || "Sin nombre",
              Producto: "Sin productos registrados",
              Cantidad: 0,
              "Precio Unitario": 0,
              "Total Producto": 0,
              "Fecha Pedido": new Date(sale.createdAt).toLocaleDateString(
                "es-MX"
              ),
              "Estatus Venta": sale.status,
              Tipo: "Sin datos",
              "Canal de Venta": sale.salesChannel,
              "Método de Pago":
                typeof sale.paymentMethod === "string"
                  ? sale.paymentMethod
                  : sale.paymentMethod?.name || "",
            });
          }
        });

        return { salesData, productsData };
      }

      return { salesData: [], productsData: [] };
    } catch (error) {
      console.error("Error al obtener datos para exportar:", error);
      return { salesData: [], productsData: [] };
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h2 className="mb-1 fw-bold">Listado de Ventas</h2>
            <p className="text-muted mb-0">
              Gestiona y consulta todas las ventas
            </p>
          </div>

          {/* Botón de exportar en el header */}
          {hasSearched && (
            <Button
              variant="success"
              size="sm"
              onClick={handleExportExcel}
              disabled={exporting}
              className="d-flex align-items-center gap-2"
              style={{
                background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                fontWeight: "600",
                boxShadow: "0 2px 8px rgba(40, 167, 69, 0.3)",
              }}
            >
              <Download size={16} />
              {exporting ? "Exportando..." : "Exportar Excel"}
            </Button>
          )}
        </div>
      </div>

      {/* Filtros de Fecha */}
      <DateFilters onSearch={handleSearch} />

      {/* Estadísticas de Ventas - Solo se muestran después de hacer una búsqueda */}
      {hasSearched && <SalesStats filters={dateFilters} />}

      {/* Tabs - Solo se muestran después de hacer una búsqueda */}
      {hasSearched ? (
        <div
          className="card border-0 shadow-sm"
          style={{ borderRadius: "15px" }}
        >
          <div className="card-body p-0">
            {/* Header con pestañas */}
            <div
              className="px-4 pt-3"
              style={{
                borderBottom: "2px solid #f1f3f5",
              }}
            >
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k || "nuevas")}
                className="border-0"
              >
                <Tab
                  eventKey="nuevas"
                  title={
                    <span className="px-3 py-2 fw-semibold">Nuevas Ventas</span>
                  }
                >
                  <div className="p-4">
                    <NewSalesTable filters={dateFilters} />
                  </div>
                </Tab>

                <Tab
                  eventKey="credito"
                  title={
                    <span className="px-3 py-2 fw-semibold">
                      Ventas a Crédito
                    </span>
                  }
                >
                  <div className="p-4">
                    <CreditSalesTable
                      filters={dateFilters}
                      creditPaymentMethodId={creditPaymentMethodId}
                    />
                  </div>
                </Tab>

                <Tab
                  eventKey="intercambio"
                  title={
                    <span className="px-3 py-2 fw-semibold">
                      Ventas de Intercambio
                    </span>
                  }
                >
                  <div className="p-4">
                    <ExchangeSalesTable filters={dateFilters} />
                  </div>
                </Tab>

                <Tab
                  eventKey="canceladas"
                  title={
                    <span className="px-3 py-2 fw-semibold">
                      Ventas Canceladas
                    </span>
                  }
                >
                  <div className="p-4">
                    <CancelledSalesTable filters={dateFilters} />
                  </div>
                </Tab>

                <Tab
                  eventKey="pendientes"
                  title={
                    <span className="px-3 py-2 fw-semibold">
                      Pendientes de Pago
                    </span>
                  }
                >
                  <div className="p-4">
                    <PendingPaymentsTable filters={dateFilters} />
                  </div>
                </Tab>
              </Tabs>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="card border-0 shadow-sm"
          style={{ borderRadius: "15px" }}
        >
          <div className="card-body p-5 text-center">
            <div className="mb-3">
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-muted"
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h5 className="text-muted mb-2">
              Selecciona los filtros y presiona "Buscar"
            </h5>
            <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
              Usa los filtros de fecha y sucursal para ver las ventas
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPage;
