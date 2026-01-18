"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Package, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useOrderSocket } from "@/hooks/useOrderSocket";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { ordersService } from "./services/orders";
import { stageCatalogsService } from "@/features/admin/modules/stageCatalogs/services/stageCatalogs";
import {
  orderPaymentsService,
  OrderPayment,
} from "@/features/admin/modules/sales/services/orderPayments";
import {
  Order,
  KanbanColumn as KanbanColumnType,
  StageCatalog,
  StageColor,
} from "./types";
import KanbanColumn from "./components/KanbanColumn";

const PizarronVentasPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStages, setLoadingStages] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [productFilter, setProductFilter] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [orderPayments, setOrderPayments] = useState<OrderPayment[]>([]);

  // Stages dinamicos
  const [productionStages, setProductionStages] = useState<StageCatalog[]>([]);
  const [shippingStages, setShippingStages] = useState<StageCatalog[]>([]);

  const { activeBranch } = useActiveBranchStore();
  const { role } = useUserRoleStore();
  const isAdministrator = role?.toLowerCase() === "administrador";
  const isManager = role?.toLowerCase() === "gerente";

  // Cargar stages del usuario
  const loadUserStages = async () => {
    try {
      setLoadingStages(true);

      // Cargar stages de Produccion
      const productionResponse = await stageCatalogsService.getUserStages(
        "Produccion"
      );
      setProductionStages(productionResponse.data || []);

      // Cargar stages de Envio para verificar si existen
      const shippingResponse = await stageCatalogsService.getUserStages(
        "Envio"
      );
      setShippingStages(shippingResponse.data || []);
    } catch (error: any) {
      console.error("Error loading stages:", error);
      toast.error(error.message || "Error al cargar las etapas del pizarron");
    } finally {
      setLoadingStages(false);
    }
  };

  // Cargar ordenes
  const loadOrders = async () => {
    try {
      setLoading(true);

      const response = await ordersService.getAllOrders({
        searchTerm,
        product: productFilter,
        ...(isAdministrator && activeBranch
          ? { branchId: activeBranch._id }
          : {}),
      });

      if (response.data) {
        // Filtrar solo las ordenes no canceladas y validas
        const validOrders = response.data.filter(
          (order) => order && order.status !== "cancelado"
        );
        setOrders(validOrders);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar las ordenes");
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserStages();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [searchTerm, productFilter, activeBranch]);

  // Sincronizar selectedOrder con orders cuando se actualice
  useEffect(() => {
    if (selectedOrder) {
      const updatedSelectedOrder = orders.find(
        (o) => o && o._id === selectedOrder._id
      );
      if (updatedSelectedOrder && updatedSelectedOrder !== selectedOrder) {
        setSelectedOrder(updatedSelectedOrder);
      }
    }
  }, [orders]);

  // Usar el hook especializado para escuchar cambios en ordenes
  useOrderSocket({
    onOrderCreated: (newOrder) => {
      console.log("[PizarronVentas] Nueva orden recibida:", newOrder);

      if (newOrder && newOrder.status !== "cancelado") {
        setOrders((prevOrders) => {
          const exists = prevOrders.some((o) => o && o._id === newOrder._id);
          if (exists) return prevOrders;
          return [newOrder as Order, ...prevOrders];
        });
        toast.info(`Nueva orden: ${newOrder.orderNumber}`);
      }
    },
    onOrderUpdated: (updatedOrder) => {
      console.log("[PizarronVentas] Orden actualizada:", updatedOrder);
      if (!updatedOrder) return;

      // Verificar si la orden fue enviada a produccion (descuento canjeado)
      const wasSentToProduction = updatedOrder.sendToProduction === true;
      const hasStage =
        updatedOrder.stage !== null && updatedOrder.stage !== undefined;
      const isNotCancelled = updatedOrder.status !== "cancelado";

      // Primero, obtener la orden anterior para detectar cambios ANTES de actualizar estado
      setOrders((prevOrders) => {
        const exists = prevOrders.some((o) => o && o._id === updatedOrder._id);
        const previousOrder = prevOrders.find(
          (o) => o && o._id === updatedOrder._id
        );

        // Detectar cambios y preparar toasts ANTES de actualizar el estado
        if (previousOrder) {
          const previousAdvance = previousOrder.advance || 0;
          const currentAdvance = updatedOrder.advance || 0;
          const previousStatus = previousOrder.status;
          const currentStatus = updatedOrder.status;

          // Usar setTimeout para mostrar toasts despues de la actualizacion del estado
          setTimeout(() => {
            // Detectar cancelacion
            if (
              previousStatus !== "cancelado" &&
              currentStatus === "cancelado"
            ) {
              toast.error(
                `La orden ${updatedOrder.orderNumber} ha sido cancelada`,
                { autoClose: 5000 }
              );
            }

            // Detectar cambios en pago
            if (currentAdvance > previousAdvance) {
              // Se agrego un pago
              const paymentAmount = currentAdvance - previousAdvance;
              const userName =
                updatedOrder.payments && updatedOrder.payments.length > 0
                  ? updatedOrder.payments[updatedOrder.payments.length - 1]
                      ?.registeredBy?.name || "Usuario"
                  : "Usuario";

              toast.success(
                `${userName} ha realizado un pago de $${paymentAmount.toFixed(
                  2
                )} en la orden ${updatedOrder.orderNumber}`,
                { autoClose: 5000 }
              );
            } else if (currentAdvance < previousAdvance) {
              // Se elimino un pago
              const paymentAmount = previousAdvance - currentAdvance;
              toast.warning(
                `Se ha eliminado un pago de $${paymentAmount.toFixed(
                  2
                )} de la orden ${updatedOrder.orderNumber}`,
                { autoClose: 5000 }
              );
            }
          }, 0);
        }

        // Si la orden fue enviada a produccion, tiene stage y no esta cancelada
        if (wasSentToProduction && hasStage && isNotCancelled) {
          if (!exists) {
            // Nueva orden llegando al pizarron
            console.log(
              "[PizarronVentas] Orden enviada a produccion - Agregando:",
              updatedOrder.orderNumber
            );

            // Verificar si tiene descuento para mostrar mensaje especifico
            const hasDiscount =
              updatedOrder.discount && updatedOrder.discount > 0;
            // Verificar si se envio automaticamente por recibir primer pago
            const wasAutoSentByPayment =
              previousOrder &&
              (previousOrder.advance || 0) === 0 &&
              (updatedOrder.advance || 0) > 0;

            let toastMessage;
            if (hasDiscount) {
              toastMessage = `Se ha autorizado el descuento de la orden ${updatedOrder.orderNumber}. Entrando a produccion`;
            } else if (wasAutoSentByPayment) {
              toastMessage = `La orden ${updatedOrder.orderNumber} ha recibido su primer pago y se envio automaticamente a produccion`;
            } else {
              toastMessage = `Orden ${updatedOrder.orderNumber} enviada a produccion`;
            }

            setTimeout(() => {
              toast.success(toastMessage, {
                autoClose: 5000,
              });
            }, 0);
            return [updatedOrder as Order, ...prevOrders];
          } else {
            // Orden ya existe, actualizar
            console.log(
              "[PizarronVentas] Actualizando orden existente:",
              updatedOrder.orderNumber
            );
            return prevOrders.map((o) =>
              o && o._id === updatedOrder._id ? (updatedOrder as Order) : o
            );
          }
        } else if (exists) {
          // Si la orden esta en el pizarron pero fue cancelada o removida
          if (!isNotCancelled) {
            console.log(
              "[PizarronVentas] Orden cancelada - Removiendo del pizarron:",
              updatedOrder.orderNumber
            );
            return prevOrders.filter((o) => o && o._id !== updatedOrder._id);
          }
          // Actualizar orden existente
          return prevOrders.map((o) =>
            o && o._id === updatedOrder._id ? (updatedOrder as Order) : o
          );
        }

        // No agregar ni modificar si no cumple las condiciones
        return prevOrders;
      });
    },
    onOrderDeleted: (data: { orderId: string }) => {
      console.log("[PizarronVentas] Orden eliminada:", data.orderId);
      setOrders((prevOrders) =>
        prevOrders.filter((o) => o && o._id !== data.orderId)
      );
      toast.error("Una orden ha sido eliminada");
    },
    filters: {
      status: ["pendiente", "en-proceso", "completado", "sinAnticipo"],
    },
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleProductFilterChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setProductFilter(e.target.value);
  };

  const handleViewDetails = async (order: Order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);

    // Cargar los pagos de la orden
    try {
      const payments = await orderPaymentsService.getOrderPayments(order._id);
      setOrderPayments(payments);
    } catch (error) {
      console.error("Error loading order payments:", error);
      setOrderPayments([]);
    }
  };

  const handleChangeStage = async (order: Order, newStageId: string) => {
    try {
      // Actualizar el stage de la orden
      await ordersService.updateOrder(order._id, {
        stage: newStageId,
      });

      // Actualizar el estado local
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o._id === order._id ? { ...o, stage: newStageId } : o
        )
      );

      toast.success("Orden movida correctamente");
    } catch (error: any) {
      toast.error(error.message || "Error al mover la orden");
      console.error("Error moving order:", error);
    }
  };

  const handleSendToShipping = async (order: Order) => {
    // Verificar que haya etapas de Envio configuradas ANTES de enviar
    if (!shippingStages || shippingStages.length === 0) {
      toast.warning("Todavia no hay etapas en el pizarron de envio");
      return;
    }

    try {
      await ordersService.sendToShipping(order._id);

      toast.success("Orden enviada al pizarron de Envio exitosamente");

      // Recargar las ordenes para reflejar el cambio
      await loadOrders();
    } catch (error: any) {
      const errorMessage = error.message || "";
      if (
        errorMessage.includes("No se encontro una etapa inicial de Envio") ||
        errorMessage.includes("stageNumber = 1") ||
        errorMessage.includes("boardType = Envio")
      ) {
        toast.warning("Todavia no hay etapas en el pizarron de envio");
      } else {
        toast.error(errorMessage || "Error al enviar la orden a Envio");
      }
      console.error("Error sending order to shipping:", error);
    }
  };

  // Convertir stages a columnas de kanban
  const createColumnsFromStages = (
    stages: StageCatalog[]
  ): KanbanColumnType[] => {
    return stages.map((stage) => ({
      id: stage._id,
      stageNumber: stage.stageNumber,
      title: stage.name,
      abreviation: stage.abreviation,
      orders: [],
      color: stage.color,
      boardType: stage.boardType,
    }));
  };

  // Obtener ordenes por stage (solo Produccion)
  const getOrdersByStage = (stageId: string): Order[] => {
    return orders.filter((order) => {
      // Validar que la orden existe
      if (!order) return false;

      // No mostrar ordenes canceladas
      if (order.status === "cancelado") return false;

      // Obtener el ID del stage de la orden
      const orderStageId =
        typeof order.stage === "string" ? order.stage : order.stage?._id;

      // Verificar que la orden tenga el stage correcto
      if (orderStageId !== stageId) return false;

      // Produccion: mostrar solo ordenes con sentToShipping = false o undefined
      return !order.sentToShipping;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Obtener el color RGBA como string CSS
  const getRGBAColor = (color: StageColor) => {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
  };

  const productionColumns = createColumnsFromStages(productionStages);

  // Obtener el maximo stageNumber de Produccion para identificar el ultimo stage
  const maxProductionStageNumber =
    productionStages.length > 0
      ? Math.max(...productionStages.map((s) => s.stageNumber))
      : 0;

  // Verificar si hay etapas de Envio configuradas
  const hasShippingStages = shippingStages && shippingStages.length > 0;

  return (
    <div className="container mx-auto py-1">
      {/* Header */}
      <div className="mb-2">
        <h2 className="font-bold mb-1 text-xl">Pizarron de Produccion</h2>
        <p className="text-muted-foreground">
          Gestiona las ordenes en las diferentes etapas de produccion
        </p>
      </div>

      {/* Filters */}
      <Card className="shadow-sm mb-2 rounded-xl">
        <CardContent className="p-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por orden, cliente..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 bg-muted/50 rounded-xl"
              />
            </div>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filtrar por producto..."
                value={productFilter}
                onChange={handleProductFilterChange}
                className="pl-10 bg-muted/50 rounded-xl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pizarron de Produccion */}
      {loadingStages ? (
        <div className="text-center py-10">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-3 text-muted-foreground">Cargando pizarron...</p>
        </div>
      ) : loading ? (
        <div className="text-center py-10">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-3 text-muted-foreground">Cargando ordenes...</p>
        </div>
      ) : productionColumns.length === 0 ? (
        <Alert className="mt-3 bg-yellow-50 border-yellow-200">
          <Package size={20} className="mr-2" />
          <AlertDescription>
            No hay etapas configuradas para el pizarron de Produccion.
            <br />
            <small>
              Crea etapas en el catalogo de etapas para poder visualizar las
              ordenes aqui.
            </small>
          </AlertDescription>
        </Alert>
      ) : (
        <DndProvider backend={HTML5Backend}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {productionColumns.map((column) => (
              <div key={column.id}>
                <KanbanColumn
                  title={column.title}
                  count={getOrdersByStage(column.id).length}
                  orders={getOrdersByStage(column.id)}
                  color={getRGBAColor(column.color)}
                  status={column.id}
                  isLastProductionStage={
                    column.stageNumber === maxProductionStageNumber
                  }
                  hasShippingStages={hasShippingStages}
                  onViewDetails={handleViewDetails}
                  onChangeStatus={handleChangeStage}
                  onSendToShipping={handleSendToShipping}
                />
              </div>
            ))}
          </div>
        </DndProvider>
      )}

      {/* Order Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-bold">Detalle de Orden</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-muted-foreground text-sm">
                    Numero de Orden
                  </label>
                  <div className="font-bold">{selectedOrder.orderNumber}</div>
                </div>
                <div>
                  <label className="text-muted-foreground text-sm">Estado</label>
                  <div className="font-bold capitalize">
                    <Badge
                      variant={
                        selectedOrder.status === "sinAnticipo"
                          ? "secondary"
                          : "default"
                      }
                      className={
                        selectedOrder.status === "sinAnticipo"
                          ? "bg-yellow-500 text-white"
                          : ""
                      }
                    >
                      {selectedOrder.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Client Info */}
              <div>
                <h6 className="font-bold mb-3">Informacion del Cliente</h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={selectedOrder.arregloUrl ? "" : "md:col-span-2"}>
                    <div className="mb-3">
                      <label className="text-muted-foreground text-sm">Nombre</label>
                      <div>{selectedOrder.clientInfo.name}</div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted-foreground text-sm">Telefono</label>
                      <div>{selectedOrder.clientInfo.phone || "N/A"}</div>
                    </div>
                    <div className="mb-2">
                      <label className="text-muted-foreground text-sm">Email</label>
                      <div>{selectedOrder.clientInfo.email || "N/A"}</div>
                    </div>
                  </div>
                  {selectedOrder.arregloUrl && (
                    <div>
                      <label className="text-muted-foreground text-sm">
                        Imagen del Arreglo
                      </label>
                      <div className="mt-2 flex justify-center">
                        <img
                          src={selectedOrder.arregloUrl}
                          alt="Arreglo"
                          className="max-h-[300px] object-contain rounded shadow-sm cursor-pointer"
                          onClick={() =>
                            window.open(selectedOrder.arregloUrl!, "_blank")
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Info */}
              {selectedOrder.deliveryData && (
                <div>
                  <h6 className="font-bold mb-3">Informacion de Entrega</h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-muted-foreground text-sm">
                        Destinatario
                      </label>
                      <div>
                        {selectedOrder.deliveryData.recipientName || "N/A"}
                      </div>
                    </div>
                    <div>
                      <label className="text-muted-foreground text-sm">
                        Fecha de Entrega
                      </label>
                      <div>
                        {selectedOrder.deliveryData.deliveryDateTime
                          ? formatDate(
                              selectedOrder.deliveryData.deliveryDateTime
                            )
                          : "N/A"}
                      </div>
                    </div>
                    {selectedOrder.deliveryData.message && (
                      <div className="md:col-span-2">
                        <label className="text-muted-foreground text-sm">
                          Mensaje
                        </label>
                        <div>{selectedOrder.deliveryData.message}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Items */}
              <div>
                <h6 className="font-bold mb-3">Productos</h6>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-center">Cantidad</TableHead>
                      <TableHead className="text-right">Precio Unitario</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Financial Summary */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground text-sm">Subtotal:</div>
                  <div className="text-right font-semibold">
                    {formatCurrency(selectedOrder.subtotal)}
                  </div>
                  {selectedOrder.discount > 0 && (
                    <>
                      <div className="text-muted-foreground text-sm">Descuento:</div>
                      <div className="text-right text-red-500">
                        -{formatCurrency(selectedOrder.discount)}
                      </div>
                    </>
                  )}
                  <div className="font-bold">Total:</div>
                  <div className="text-right font-bold text-lg">
                    {formatCurrency(selectedOrder.total)}
                  </div>
                  {(() => {
                    const advancePayment = orderPayments.find(
                      (p) => p.isAdvance
                    );
                    return advancePayment ? (
                      <>
                        <div className="text-muted-foreground text-sm">Anticipo:</div>
                        <div className="text-right text-green-600">
                          {formatCurrency(advancePayment.amount)}
                        </div>
                      </>
                    ) : null;
                  })()}
                  {selectedOrder.remainingBalance > 0 && (
                    <>
                      <div className="text-red-500 text-sm font-bold">
                        Saldo Pendiente:
                      </div>
                      <div className="text-right text-red-500 font-bold">
                        {formatCurrency(selectedOrder.remainingBalance)}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PizarronVentasPage;
