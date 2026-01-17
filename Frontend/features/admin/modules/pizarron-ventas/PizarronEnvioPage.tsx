"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { Search, Package, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useOrderSocket } from "@/hooks/useOrderSocket";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { ordersService } from "./services/orders";
import { stageCatalogsService } from "@/features/admin/modules/stageCatalogs/services/stageCatalogs";
import { Order, KanbanColumn as KanbanColumnType, StageCatalog, StageColor } from "./types";
import KanbanColumn from "./components/KanbanColumn";

const PizarronEnvioPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStages, setLoadingStages] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [productFilter, setProductFilter] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);

  // Stages dinamicos
  const [shippingStages, setShippingStages] = useState<StageCatalog[]>([]);

  const { activeBranch } = useActiveBranchStore();
  const { role } = useUserRoleStore();
  const isAdministrator = role?.toLowerCase() === "administrador";

  // Cargar stages del usuario
  const loadUserStages = async () => {
    try {
      setLoadingStages(true);

      // Cargar stages de Envio
      const shippingResponse = await stageCatalogsService.getUserStages('Envio');
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
        ...(isAdministrator && activeBranch ? { branchId: activeBranch._id } : {})
      });

      if (response.data) {
        // Filtrar solo las ordenes no canceladas
        const validOrders = response.data.filter(
          (order) => order.status !== "cancelado"
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

  // Usar el hook especializado para escuchar cambios en ordenes
  useOrderSocket({
    onOrderCreated: (newOrder) => {
      console.log("[PizarronEnvio] Nueva orden recibida:", newOrder);

      if (newOrder.status !== "cancelado") {
        setOrders((prevOrders) => {
          const exists = prevOrders.some((o) => o._id === newOrder._id);
          if (exists) return prevOrders;
          return [newOrder as Order, ...prevOrders];
        });
        toast.info(`Nueva orden: ${newOrder.orderNumber}`);
      }
    },
    onOrderUpdated: (updatedOrder) => {
      console.log("[PizarronEnvio] Orden actualizada:", updatedOrder);
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o._id === updatedOrder._id ? updatedOrder as Order : o
        )
      );
    },
    onOrderDeleted: (data: { orderId: string }) => {
      console.log("[PizarronEnvio] Orden eliminada:", data.orderId);
      setOrders((prevOrders) =>
        prevOrders.filter((o) => o._id !== data.orderId)
      );
      toast.info("Una orden ha sido eliminada");
    },
    filters: {
      status: ["pendiente", "en-proceso", "completado"],
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

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleChangeStage = async (order: Order, newStageId: string) => {
    try {
      // Actualizar el stage de la orden
      await ordersService.updateOrder(order._id, {
        stage: newStageId,
      });

      // Actualizar el estado local
      setOrders(prevOrders =>
        prevOrders.map(o =>
          o._id === order._id
            ? { ...o, stage: newStageId }
            : o
        )
      );

      toast.success("Orden movida correctamente");
    } catch (error: any) {
      toast.error(error.message || "Error al mover la orden");
      console.error("Error moving order:", error);
    }
  };

  // Convertir stages a columnas de kanban
  const createColumnsFromStages = (stages: StageCatalog[]): KanbanColumnType[] => {
    return stages.map(stage => ({
      id: stage._id,
      stageNumber: stage.stageNumber,
      title: stage.name,
      abreviation: stage.abreviation,
      orders: [],
      color: stage.color,
      boardType: stage.boardType,
    }));
  };

  // Obtener ordenes por stage (solo Envio)
  const getOrdersByStage = (stageId: string): Order[] => {
    return orders.filter((order) => {
      // No mostrar ordenes canceladas
      if (order.status === 'cancelado') return false;

      // Obtener el ID del stage de la orden
      const orderStageId = typeof order.stage === 'string'
        ? order.stage
        : order.stage?._id;

      // Verificar que la orden tenga el stage correcto
      if (orderStageId !== stageId) return false;

      // Envio: mostrar solo ordenes con sentToShipping = true
      return order.sentToShipping === true;
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

  const shippingColumns = createColumnsFromStages(shippingStages);

  return (
    <div className="container mx-auto py-1 px-4">
      {/* Header */}
      <div className="mb-2">
        <h2 className="font-bold text-2xl mb-1">Pizarron de Envio</h2>
        <p className="text-muted-foreground">Gestiona las ordenes en las diferentes etapas de envio</p>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-2 rounded-lg">
        <CardContent className="p-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por orden, cliente..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 bg-muted/50 border-0"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filtrar por producto..."
                value={productFilter}
                onChange={handleProductFilterChange}
                className="pl-10 bg-muted/50 border-0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pizarron de Envio */}
      {loadingStages ? (
        <div className="text-center py-5">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto" />
          <p className="mt-3 text-muted-foreground">Cargando pizarron...</p>
        </div>
      ) : loading ? (
        <div className="text-center py-5">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto" />
          <p className="mt-3 text-muted-foreground">Cargando ordenes...</p>
        </div>
      ) : shippingColumns.length === 0 ? (
        <Alert variant="default" className="mt-3 border-yellow-300 bg-yellow-50">
          <Package className="h-5 w-5 text-yellow-600" />
          <AlertDescription className="ml-2">
            No hay etapas configuradas para el pizarron de Envio.
            <br />
            <small>Crea etapas en el catalogo de etapas para poder visualizar las ordenes aqui.</small>
          </AlertDescription>
        </Alert>
      ) : (
        <DndProvider backend={HTML5Backend}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {shippingColumns.map((column) => (
              <div key={column.id}>
                <KanbanColumn
                  title={column.title}
                  count={getOrdersByStage(column.id).length}
                  orders={getOrdersByStage(column.id)}
                  color={getRGBAColor(column.color)}
                  status={column.id}
                  onViewDetails={handleViewDetails}
                  onChangeStatus={handleChangeStage}
                />
              </div>
            ))}
          </div>
        </DndProvider>
      )}

      {/* Order Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="border-b-0 pb-0">
            <DialogTitle className="font-bold text-lg">Detalle de Orden</DialogTitle>
          </DialogHeader>
          <div className="pt-1 pb-2">
            {selectedOrder && (
              <>
                {/* Order Info */}
                <div className="mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="mb-3">
                      <label className="text-muted-foreground text-sm mb-1 block">
                        Numero de Orden
                      </label>
                      <div className="font-bold">{selectedOrder.orderNumber}</div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted-foreground text-sm mb-1 block">Estado</label>
                      <div className="font-bold capitalize">
                        <Badge
                          variant={selectedOrder.status === 'sinAnticipo' ? 'outline' : 'default'}
                          className={selectedOrder.status === 'sinAnticipo' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : ''}
                        >
                          {selectedOrder.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Client Info */}
                <div className="mb-4">
                  <h6 className="font-bold mb-3">Informacion del Cliente</h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className={selectedOrder.arregloUrl ? "" : "md:col-span-2"}>
                      <div className="mb-3">
                        <label className="text-muted-foreground text-sm mb-1 block">Nombre</label>
                        <div>{selectedOrder.clientInfo.name}</div>
                      </div>
                      <div className="mb-3">
                        <label className="text-muted-foreground text-sm mb-1 block">Telefono</label>
                        <div>{selectedOrder.clientInfo.phone || "N/A"}</div>
                      </div>
                      <div className="mb-2">
                        <label className="text-muted-foreground text-sm mb-1 block">Email</label>
                        <div>{selectedOrder.clientInfo.email || "N/A"}</div>
                      </div>
                    </div>
                    {selectedOrder.arregloUrl && (
                      <div>
                        <div className="mb-2">
                          <label className="text-muted-foreground text-sm mb-1 block">Imagen del Arreglo</label>
                          <div className="mt-2 flex justify-center">
                            <img
                              src={selectedOrder.arregloUrl}
                              alt="Arreglo"
                              className="rounded shadow-sm cursor-pointer"
                              style={{
                                maxHeight: "300px",
                                objectFit: "contain",
                              }}
                              onClick={() => window.open(selectedOrder.arregloUrl!, '_blank')}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Info */}
                {selectedOrder.deliveryData && (
                  <div className="mb-4">
                    <h6 className="font-bold mb-3">Informacion de Entrega</h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="mb-2">
                        <label className="text-muted-foreground text-sm mb-1 block">
                          Destinatario
                        </label>
                        <div>
                          {selectedOrder.deliveryData.recipientName || "N/A"}
                        </div>
                      </div>
                      <div className="mb-2">
                        <label className="text-muted-foreground text-sm mb-1 block">
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
                        <div className="md:col-span-2 mb-2">
                          <label className="text-muted-foreground text-sm mb-1 block">
                            Mensaje
                          </label>
                          <div>{selectedOrder.deliveryData.message}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Items */}
                <div className="mb-4">
                  <h6 className="font-bold mb-3">Productos</h6>
                  <div className="border rounded-lg overflow-hidden">
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
                </div>

                {/* Financial Summary */}
                <div className="bg-muted/50 p-3 rounded-lg">
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
                    {selectedOrder.advance > 0 && (
                      <>
                        <div className="text-muted-foreground text-sm">Anticipo:</div>
                        <div className="text-right text-green-600">
                          {formatCurrency(selectedOrder.advance)}
                        </div>
                      </>
                    )}
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
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PizarronEnvioPage;
