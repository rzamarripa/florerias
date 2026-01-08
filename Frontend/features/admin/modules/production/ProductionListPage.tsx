"use client";

import React, { useState, useEffect, useRef } from "react";
import { Tabs, Tab, Alert } from "react-bootstrap";
import { Factory, CalendarDays, Calendar, Clock, Cuboid } from "lucide-react";
import TodayProductionTable from "./components/tables/TodayProductionTable";
import TomorrowProductionTable from "./components/tables/TomorrowProductionTable";
import LaterProductionTable from "./components/tables/LaterProductionTable";
import { branchesService } from "../branches/services/branches";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { useOrderSocket } from "@/hooks/useOrderSocket";
import { toast } from "react-toastify";

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
        // Si solo hay una sucursal, seleccionarla automáticamente
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

  // Socket listener para detectar nuevas órdenes y actualizaciones
  useOrderSocket({
    filters: {
      branchId: selectedBranchId,
    },
    onOrderCreated: (newOrder) => {
      // Verificar si la orden es para producción y tiene fecha de entrega
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
          
          // Resetear las horas para comparación de fechas
          today.setHours(0, 0, 0, 0);
          tomorrow.setHours(0, 0, 0, 0);
          deliveryDate.setHours(0, 0, 0, 0);
          
          let tabToNotify = "";
          if (deliveryDate.getTime() === today.getTime()) {
            tabToNotify = "hoy";
          } else if (deliveryDate.getTime() === tomorrow.getTime()) {
            tabToNotify = "mañana";
          } else if (deliveryDate > tomorrow) {
            tabToNotify = "posteriores";
          }
          
          if (tabToNotify) {
            // Notificar sobre la nueva orden
            toast.info(
              `Nueva orden #${newOrder.orderNumber} agregada a producción (${tabToNotify})`,
              { autoClose: 5000 }
            );
            
            // Forzar actualización de las tablas
            setRefreshKey((prev) => prev + 1);
          }
        }
      }
    },
    onOrderUpdated: (updatedOrder) => {
      const orderId = updatedOrder._id;
      
      // Si la orden fue enviada a producción y no estaba antes
      if (updatedOrder.sendToProduction && !ordersStateRef.current.has(orderId)) {
        const orderBranchId = typeof updatedOrder.branchId === 'object' 
          ? updatedOrder.branchId._id 
          : updatedOrder.branchId;
        
        if (!selectedBranchId || orderBranchId === selectedBranchId) {
          toast.success(
            `Orden #${updatedOrder.orderNumber} fue enviada a producción`,
            { autoClose: 5000 }
          );
          
          // Forzar actualización de las tablas
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
      // Forzar actualización de las tablas
      setRefreshKey((prev) => prev + 1);
    },
  });

  // Función para obtener la fecha actual formateada
  const getTodayDate = () => {
    const today = new Date();
    return today.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Función para obtener la fecha de mañana formateada
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

  return (
    <div className="container-fluid py-2">
      {/* Header */}
      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h2 className="mb-1 fw-bold d-flex align-items-center gap-2">
              <Cuboid size={28} />
              Listado de Producción
            </h2>
            <p className="text-muted mb-0">
              Gestiona las órdenes programadas para producción
            </p>
          </div>

          {/* Selector de sucursal si hay múltiples */}
          {branches.length > 1 && (
            <div className="d-flex align-items-center gap-2">
              <label className="text-muted small">Sucursal:</label>
              <select
                className="form-select form-select-sm"
                value={selectedBranchId || ""}
                onChange={(e) =>
                  setSelectedBranchId(e.target.value || undefined)
                }
                style={{ minWidth: "200px" }}
              >
                <option value="">Todas las sucursales</option>
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.branchName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tabs con el mismo diseño que SalesPage */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: "10px" }}>
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
              onSelect={(k) => setActiveTab(k || "hoy")}
              className="border-0"
            >
              <Tab
                eventKey="hoy"
                title={
                  <span className="px-3 py-2 fw-semibold d-flex align-items-center gap-2">
                    <CalendarDays size={18} />
                    Hoy
                  </span>
                }
              >
                <div className="p-4">
                  <TodayProductionTable
                    key={`today-${refreshKey}`}
                    branchId={selectedBranchId}
                    onProductionUpdate={() => setRefreshKey((prev) => prev + 1)}
                  />
                </div>
              </Tab>

              <Tab
                eventKey="manana"
                title={
                  <span className="px-3 py-2 fw-semibold d-flex align-items-center gap-2">
                    <Calendar size={18} />
                    Mañana
                  </span>
                }
              >
                <div className="p-4">
                  <TomorrowProductionTable
                    key={`tomorrow-${refreshKey}`}
                    branchId={selectedBranchId}
                    onProductionUpdate={() => setRefreshKey((prev) => prev + 1)}
                  />
                </div>
              </Tab>

              <Tab
                eventKey="posteriores"
                title={
                  <span className="px-3 py-2 fw-semibold d-flex align-items-center gap-2">
                    <CalendarDays size={18} />
                    Posteriores
                  </span>
                }
              >
                <div className="p-4">
                  <LaterProductionTable
                    key={`later-${refreshKey}`}
                    branchId={selectedBranchId}
                    onProductionUpdate={() => setRefreshKey((prev) => prev + 1)}
                  />
                </div>
              </Tab>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Footer con información adicional */}
      <div className="mt-3 text-center text-muted small">
        <p className="mb-1">
          Solo se muestran órdenes con anticipo o enviadas a producción
        </p>
        <p className="mb-0">
          Las órdenes se organizan por fecha y hora de entrega
          (deliveryDateTime)
        </p>
      </div>
    </div>
  );
};

export default ProductionListPage;
