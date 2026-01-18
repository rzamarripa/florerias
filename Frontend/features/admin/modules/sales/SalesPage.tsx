"use client";

import React, { useState, useEffect, useRef } from "react";
import { Download, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import DateFilters from "./components/DateFilters";
import SalesStats from "./components/SalesStats";
import NewSalesTable from "./components/tables/NewSalesTable";
import CreditSalesTable from "./components/tables/CreditSalesTable";
import ExchangeSalesTable from "./components/tables/ExchangeSalesTable";
import CancelledSalesTable from "./components/tables/CancelledSalesTable";
import PendingPaymentsTable from "./components/tables/PendingPaymentsTable";
import UnauthorizedSalesTable from "./components/tables/UnauthorizedSalesTable";
import { paymentMethodsService } from "../payment-methods/services/paymentMethods";
import { salesService } from "./services/sales";
import { toast } from "react-toastify";
import { useOrderSocket } from "@/hooks/useOrderSocket";

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
  const [exchangePaymentMethodId, setExchangePaymentMethodId] = useState<
    string | undefined
  >(undefined);
  const [exporting, setExporting] = useState<boolean>(false);
  const [statsRefreshKey, setStatsRefreshKey] = useState<number>(0);
  const ordersPaymentStateRef = useRef<Map<string, number>>(new Map());
  const ordersStatusStateRef = useRef<Map<string, string>>(new Map());

  // Socket listener centralizado para detectar cambios de pago y cancelaciones (evita toasts duplicados)
  useOrderSocket({
    filters: {},
    onOrderCreated: () => {},
    onOrderUpdated: (updatedOrder) => {
      const orderId = updatedOrder._id;
      const previousAdvance = ordersPaymentStateRef.current.get(orderId);
      const currentAdvance = updatedOrder.advance || 0;
      const previousStatus = ordersStatusStateRef.current.get(orderId);
      const currentStatus = updatedOrder.status;

      // Detectar cancelación de orden
      if (previousStatus && previousStatus !== "cancelado" && currentStatus === "cancelado") {
        toast.error(
          `La orden ${updatedOrder.orderNumber} ha sido cancelada`,
          { autoClose: 5000 }
        );
      }

      // Si ya conocíamos esta orden, detectar cambios de pago
      if (previousAdvance !== undefined) {
        if (currentAdvance > previousAdvance) {
          // Se agregó un pago
          const paymentAmount = currentAdvance - previousAdvance;
          const userName = updatedOrder.payments && updatedOrder.payments.length > 0
            ? updatedOrder.payments[updatedOrder.payments.length - 1]?.registeredBy?.name || "Usuario"
            : "Usuario";

          toast.success(
            `${userName} ha realizado un pago de $${paymentAmount.toFixed(2)} en la orden ${updatedOrder.orderNumber}`,
            { autoClose: 5000 }
          );
        } else if (currentAdvance < previousAdvance) {
          // Se eliminó un pago
          const paymentAmount = previousAdvance - currentAdvance;
          toast.warning(
            `Se ha eliminado un pago de $${paymentAmount.toFixed(2)} de la orden ${updatedOrder.orderNumber}`,
            { autoClose: 5000 }
          );
        }
      }

      // Actualizar el estado almacenado
      ordersPaymentStateRef.current.set(orderId, currentAdvance);
      ordersStatusStateRef.current.set(orderId, currentStatus);
    },
    onOrderDeleted: () => {},
  });

  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        const response = await paymentMethodsService.getAllPaymentMethods({
          status: true,
        });
        if (response.data) {
          // Buscar el método de pago que sea exactamente la palabra "credito"
          // (con o sin tilde, mayúsculas/minúsculas, pero que NO incluya otras palabras como "Tarjeta de Credito")
          const creditMethod = response.data.find((pm) => {
            const normalized = pm.name
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, ""); // Quitar tildes
            return normalized === "credito";
          });
          if (creditMethod) {
            setCreditPaymentMethodId(creditMethod._id);
          }

          // Buscar el método de pago que sea exactamente la palabra "intercambio"
          const exchangeMethod = response.data.find((pm) => {
            const normalized = pm.name
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, ""); // Quitar tildes
            return normalized === "intercambio";
          });
          if (exchangeMethod) {
            setExchangePaymentMethodId(exchangeMethod._id);
          }
        }
      } catch (error) {
        console.error("Error loading payment methods:", error);
      }
    };

    loadPaymentMethods();
  }, []);

  // Cargar automáticamente los datos del día actual al abrir la página
  useEffect(() => {
    // Simular que el usuario hizo búsqueda con la fecha actual
    const today = new Date().toISOString().split("T")[0];
    setDateFilters({
      startDate: today,
      endDate: today,
      viewMode: "dia",
      branchId: undefined,
    });
    setHasSearched(true);
  }, []); // Solo ejecutar al montar el componente

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

  const handleSaleUpdated = () => {
    // Incrementar la key para forzar re-render de SalesStats
    setStatsRefreshKey((prev) => prev + 1);
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

      // Crear el archivo Excel con ExcelJS
      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Sistema de Ventas";
      workbook.created = new Date();

      // Anchos de columna
      const salesColWidths = [15, 25, 15, 25, 15, 12, 12, 12, 20, 12, 10, 12, 10, 10, 10, 15, 12, 8, 10];
      const productsColWidths = [15, 25, 30, 10, 12, 12, 15, 12, 12, 15, 15];
      const summaryColWidths = [40, 30];

      // Hoja 1: Resumen de Ventas
      const salesSheet = workbook.addWorksheet("Resumen Ventas");
      if (salesData.length > 0) {
        const salesHeaders = Object.keys(salesData[0]);
        salesSheet.addRow(salesHeaders);
        salesSheet.getRow(1).font = { bold: true };
        salesSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E0E0" } };
        salesData.forEach((row: any) => salesSheet.addRow(Object.values(row)));
        salesColWidths.forEach((width, i) => { if (salesSheet.columns[i]) salesSheet.columns[i].width = width; });
      }

      // Hoja 2: Detalle de Productos con subtotales
      const productsSheet = workbook.addWorksheet("Productos Vendidos");
      if (productsData.length > 0) {
        // Ordenar productos por cliente y folio
        const sortedProducts = [...productsData].sort((a, b) => {
          if (a.Cliente !== b.Cliente) return a.Cliente.localeCompare(b.Cliente);
          return a.Folio.localeCompare(b.Folio);
        });

        // Crear datos con subtotales
        const productsWithSubtotals: any[] = [];
        let currentClient = "";
        let clientTotal = 0;
        let clientCount = 0;

        sortedProducts.forEach((product) => {
          if (product.Cliente !== currentClient) {
            if (currentClient !== "") {
              productsWithSubtotals.push({
                Folio: "", Cliente: `SUBTOTAL ${currentClient}`, Producto: "",
                Cantidad: clientCount, "Precio Unitario": "", "Total Producto": clientTotal,
                "Fecha Pedido": "", "Estatus Venta": "", Tipo: "SUBTOTAL",
                "Canal de Venta": "", "Método de Pago": "",
              });
            }
            currentClient = product.Cliente;
            clientTotal = 0;
            clientCount = 0;
          }
          productsWithSubtotals.push(product);
          clientTotal += product["Total Producto"] || 0;
          clientCount += product.Cantidad || 0;
        });

        if (currentClient !== "") {
          productsWithSubtotals.push({
            Folio: "", Cliente: `SUBTOTAL ${currentClient}`, Producto: "",
            Cantidad: clientCount, "Precio Unitario": "", "Total Producto": clientTotal,
            "Fecha Pedido": "", "Estatus Venta": "", Tipo: "SUBTOTAL",
            "Canal de Venta": "", "Método de Pago": "",
          });
        }

        // Total general
        const grandTotal = productsData.reduce((sum: number, p: any) => sum + (p["Total Producto"] || 0), 0);
        const grandCount = productsData.reduce((sum: number, p: any) => sum + (p.Cantidad || 0), 0);
        productsWithSubtotals.push({
          Folio: "", Cliente: "TOTAL GENERAL", Producto: "",
          Cantidad: grandCount, "Precio Unitario": "", "Total Producto": grandTotal,
          "Fecha Pedido": "", "Estatus Venta": "", Tipo: "TOTAL",
          "Canal de Venta": "", "Método de Pago": "",
        });

        const productHeaders = Object.keys(productsWithSubtotals[0]);
        productsSheet.addRow(productHeaders);
        productsSheet.getRow(1).font = { bold: true };
        productsSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E0E0" } };
        productsWithSubtotals.forEach((row: any) => productsSheet.addRow(Object.values(row)));
        productsColWidths.forEach((width, i) => { if (productsSheet.columns[i]) productsSheet.columns[i].width = width; });
      }

      // Hoja 3: Resumen Ejecutivo
      const summarySheet = workbook.addWorksheet("Resumen Ejecutivo");
      const summaryData = generateSummaryData(salesData, productsData);
      if (summaryData.length > 0) {
        const summaryHeaders = Object.keys(summaryData[0]);
        summarySheet.addRow(summaryHeaders);
        summarySheet.getRow(1).font = { bold: true };
        summaryData.forEach((row: any) => summarySheet.addRow(Object.values(row)));
        summaryColWidths.forEach((width, i) => { if (summarySheet.columns[i]) summarySheet.columns[i].width = width; });
      }

      // Descargar el archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

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
          if (!creditPaymentMethodId) {
            return { salesData: [], productsData: [] };
          }
          response = await salesService.getCreditSales({
            startDate: dateFilters.startDate,
            endDate: dateFilters.endDate,
            branchId: dateFilters.branchId,
            creditPaymentMethodId,
          });
          break;
        case "intercambio":
          if (!exchangePaymentMethodId) {
            return { salesData: [], productsData: [] };
          }
          response = await salesService.getExchangeSales({
            startDate: dateFilters.startDate,
            endDate: dateFilters.endDate,
            branchId: dateFilters.branchId,
            exchangePaymentMethodId,
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
        case "sin-autorizar":
          response = await salesService.getUnauthorizedSales({
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
    <div className="container mx-auto py-2 px-4">
      {/* Header */}
      <div className="mb-2">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="mb-1 font-bold text-2xl">Listado de Ventas</h2>
            <p className="text-muted-foreground mb-0">
              Gestiona y consulta todas las ventas
            </p>
          </div>

          {/* Boton de exportar en el header */}
          {hasSearched && (
            <Button
              variant="default"
              size="sm"
              onClick={handleExportExcel}
              disabled={exporting}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {exporting ? "Exportando..." : "Exportar Excel"}
            </Button>
          )}
        </div>
      </div>

      {/* Filtros de Fecha */}
      <DateFilters onSearch={handleSearch} />

      {/* Estadisticas de Ventas - Solo se muestran después de hacer una búsqueda */}
      {hasSearched && (
        <SalesStats key={statsRefreshKey} filters={dateFilters} />
      )}

      {/* Tabs - Solo se muestran después de hacer una búsqueda */}
      {hasSearched ? (
        <Card className="shadow-sm rounded-xl">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-4 pt-3 border-b">
                <TabsList className="bg-transparent h-auto p-0 gap-0">
                  <TabsTrigger
                    value="nuevas"
                    className="px-4 py-2 font-semibold rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    Nuevas Ventas
                  </TabsTrigger>

                  {creditPaymentMethodId && (
                    <TabsTrigger
                      value="credito"
                      className="px-4 py-2 font-semibold rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                      Ventas a Credito
                    </TabsTrigger>
                  )}

                  {exchangePaymentMethodId && (
                    <TabsTrigger
                      value="intercambio"
                      className="px-4 py-2 font-semibold rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                      Ventas de Intercambio
                    </TabsTrigger>
                  )}

                  <TabsTrigger
                    value="canceladas"
                    className="px-4 py-2 font-semibold rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    Ventas Canceladas
                  </TabsTrigger>

                  <TabsTrigger
                    value="pendientes"
                    className="px-4 py-2 font-semibold rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    Pendientes de Pago
                  </TabsTrigger>

                  <TabsTrigger
                    value="sin-autorizar"
                    className="px-4 py-2 font-semibold rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    Por Autorizar
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="nuevas" className="p-4 mt-0">
                <NewSalesTable
                  filters={dateFilters}
                  onStatsUpdate={handleSaleUpdated}
                />
              </TabsContent>

              {creditPaymentMethodId && (
                <TabsContent value="credito" className="p-4 mt-0">
                  <CreditSalesTable
                    filters={dateFilters}
                    creditPaymentMethodId={creditPaymentMethodId}
                    onStatsUpdate={handleSaleUpdated}
                  />
                </TabsContent>
              )}

              {exchangePaymentMethodId && (
                <TabsContent value="intercambio" className="p-4 mt-0">
                  <ExchangeSalesTable
                    filters={dateFilters}
                    exchangePaymentMethodId={exchangePaymentMethodId}
                  />
                </TabsContent>
              )}

              <TabsContent value="canceladas" className="p-4 mt-0">
                <CancelledSalesTable filters={dateFilters} />
              </TabsContent>

              <TabsContent value="pendientes" className="p-4 mt-0">
                <PendingPaymentsTable
                  filters={dateFilters}
                  onStatsUpdate={handleSaleUpdated}
                />
              </TabsContent>

              <TabsContent value="sin-autorizar" className="p-4 mt-0">
                <UnauthorizedSalesTable
                  filters={dateFilters}
                  onStatsUpdate={handleSaleUpdated}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm rounded-xl">
          <CardContent className="p-4 text-center">
            <div className="mb-3">
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-muted-foreground mx-auto"
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h5 className="text-muted-foreground mb-2 font-medium">
              Selecciona los filtros y presiona "Buscar"
            </h5>
            <p className="text-muted-foreground mb-0 text-sm">
              Usa los filtros de fecha y sucursal para ver las ventas
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SalesPage;
