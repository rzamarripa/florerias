"use client";

import React, { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Factory, CalendarDays, Calendar, Clock, Cuboid, FileSpreadsheet, Loader2 } from "lucide-react";
import TodayProductionTable from "./components/tables/TodayProductionTable";
import TomorrowProductionTable from "./components/tables/TomorrowProductionTable";
import LaterProductionTable from "./components/tables/LaterProductionTable";
import { branchesService } from "../branches/services/branches";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { useOrderSocket } from "@/hooks/useOrderSocket";
import { toast } from "react-toastify";
import { productionOrdersService } from "./services/productionOrders";
import { generateProductionExcelReport } from "./utils/productionExcelReport";

const ProductionListPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("hoy");
  const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(
    undefined
  );
  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState<boolean>(false);
  const { role } = useUserRoleStore();
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const ordersStateRef = useRef<Set<string>>(new Set());
  const [exportingExcel, setExportingExcel] = useState<boolean>(false);

  // Cargar sucursales del usuario
  useEffect(() => {
    fetchUserBranches();
  }, []);

  const fetchUserBranches = async () => {
    setLoadingBranches(true);
    try {
      const response = await branchesService.getUserBranches();
      if (response.success && response.data) {
        setBranches(response.data);
        // Si solo hay una sucursal, seleccionarla automaticamente
        if (response.data.length === 1) {
          setSelectedBranchId(response.data[0]._id);
        }
      }
    } catch (error) {
      console.error("Error al cargar sucursales:", error);
      toast.error("Error al cargar las sucursales");
    } finally {
      setLoadingBranches(false);
    }
  };

  // Socket listener para detectar nuevas ordenes y actualizaciones
  useOrderSocket({
    filters: {
      branchId: selectedBranchId,
    },
    onOrderCreated: (newOrder) => {
      // Verificar si la orden es para produccion y tiene fecha de entrega
      if (newOrder.sendToProduction && newOrder.deliveryData?.deliveryDateTime) {
        const orderBranchId = typeof newOrder.branchId === 'object'
          ? newOrder.branchId._id
          : newOrder.branchId;

        // Solo actualizar si es de la sucursal seleccionada o no hay sucursal seleccionada
        if (!selectedBranchId || orderBranchId === selectedBranchId) {
          const deliveryDate = new Date(newOrder.deliveryData.deliveryDateTime);
          const today = new Date();
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);

          // Resetear las horas para comparacion de fechas
          today.setHours(0, 0, 0, 0);
          tomorrow.setHours(0, 0, 0, 0);
          deliveryDate.setHours(0, 0, 0, 0);

          let tabToNotify = "";
          if (deliveryDate.getTime() === today.getTime()) {
            tabToNotify = "hoy";
          } else if (deliveryDate.getTime() === tomorrow.getTime()) {
            tabToNotify = "manana";
          } else if (deliveryDate > tomorrow) {
            tabToNotify = "posteriores";
          }

          if (tabToNotify) {
            // Notificar sobre la nueva orden
            toast.info(
              `Nueva orden #${newOrder.orderNumber} agregada a produccion (${tabToNotify})`,
              { autoClose: 5000 }
            );

            // Forzar actualizacion de las tablas
            setRefreshKey((prev) => prev + 1);
          }
        }
      }
    },
    onOrderUpdated: (updatedOrder) => {
      const orderId = updatedOrder._id;

      // Si la orden fue enviada a produccion y no estaba antes
      if (updatedOrder.sendToProduction && !ordersStateRef.current.has(orderId)) {
        const orderBranchId = typeof updatedOrder.branchId === 'object'
          ? updatedOrder.branchId._id
          : updatedOrder.branchId;

        if (!selectedBranchId || orderBranchId === selectedBranchId) {
          toast.success(
            `Orden #${updatedOrder.orderNumber} fue enviada a produccion`,
            { autoClose: 5000 }
          );

          // Forzar actualizacion de las tablas
          setRefreshKey((prev) => prev + 1);
        }
      }

      // Actualizar el estado de seguimiento
      if (updatedOrder.sendToProduction) {
        ordersStateRef.current.add(orderId);
      } else {
        ordersStateRef.current.delete(orderId);
      }
    },
    onOrderDeleted: () => {
      // Forzar actualizacion de las tablas
      setRefreshKey((prev) => prev + 1);
    },
  });

  // Funcion para obtener la fecha actual formateada
  const getTodayDate = () => {
    const today = new Date();
    return today.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Funcion para obtener la fecha de manana formateada
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Funcion para exportar a Excel
  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);

      // Obtener todas las ordenes de produccion
      const allOrders = await productionOrdersService.getAllProductionOrders(selectedBranchId);

      // Verificar si hay ordenes para exportar
      const totalOrders = allOrders.todayOrders.length +
                         allOrders.tomorrowOrders.length +
                         allOrders.laterOrders.length;

      if (totalOrders === 0) {
        toast.warning("No hay ordenes de produccion para exportar");
        return;
      }

      // Obtener el nombre de la sucursal seleccionada
      const selectedBranch = branches.find(b => b._id === selectedBranchId);
      const branchName = selectedBranch?.branchName;

      // Generar el reporte Excel
      generateProductionExcelReport(allOrders, branchName);

      toast.success(`Reporte Excel generado con ${totalOrders} ordenes`);
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      toast.error("Error al generar el reporte Excel");
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <div className="container mx-auto py-2">
      {/* Header */}
      <div className="mb-3">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="mb-1 font-bold text-2xl flex items-center gap-2">
              <Cuboid size={28} />
              Listado de Produccion
            </h2>
            <p className="text-muted-foreground mb-0">
              Gestiona las ordenes programadas para produccion
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Selector de sucursal si hay multiples */}
            {branches.length > 1 && (
              <div className="flex items-center gap-2">
                <label className="text-muted-foreground text-sm">Sucursal:</label>
                <Select
                  value={selectedBranchId || "all"}
                  onValueChange={(value) =>
                    setSelectedBranchId(value === "all" ? undefined : value)
                  }
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Todas las sucursales" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las sucursales</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch._id} value={branch._id}>
                        {branch.branchName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Boton de exportar Excel */}
            <Button
              variant="default"
              onClick={handleExportExcel}
              disabled={exportingExcel || loadingBranches}
              className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700"
            >
              {exportingExcel ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <FileSpreadsheet size={20} />
                  Exportar a Excel
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs con diseno mas compacto */}
      <Card className="border-0 shadow-sm rounded-lg">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-3 pt-2 border-b">
              <TabsList className="bg-transparent">
                <TabsTrigger
                  value="hoy"
                  className="px-4 py-2 font-semibold flex items-center gap-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <CalendarDays size={14} />
                  Hoy
                </TabsTrigger>
                <TabsTrigger
                  value="manana"
                  className="px-4 py-2 font-semibold flex items-center gap-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Calendar size={14} />
                  Manana
                </TabsTrigger>
                <TabsTrigger
                  value="posteriores"
                  className="px-4 py-2 font-semibold flex items-center gap-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <CalendarDays size={14} />
                  Posteriores
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="hoy" className="p-3 mt-0">
              <TodayProductionTable
                key={`today-${refreshKey}`}
                branchId={selectedBranchId}
                onProductionUpdate={() => setRefreshKey((prev) => prev + 1)}
              />
            </TabsContent>

            <TabsContent value="manana" className="p-3 mt-0">
              <TomorrowProductionTable
                key={`tomorrow-${refreshKey}`}
                branchId={selectedBranchId}
                onProductionUpdate={() => setRefreshKey((prev) => prev + 1)}
              />
            </TabsContent>

            <TabsContent value="posteriores" className="p-3 mt-0">
              <LaterProductionTable
                key={`later-${refreshKey}`}
                branchId={selectedBranchId}
                onProductionUpdate={() => setRefreshKey((prev) => prev + 1)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Footer con informacion adicional */}
      <div className="mt-3 text-center text-muted-foreground text-sm">
        <p className="mb-1">
          Solo se muestran ordenes con anticipo o enviadas a produccion
        </p>
        <p className="mb-0">
          Las ordenes se organizan por fecha y hora de entrega
          (deliveryDateTime)
        </p>
      </div>
    </div>
  );
};

export default ProductionListPage;
