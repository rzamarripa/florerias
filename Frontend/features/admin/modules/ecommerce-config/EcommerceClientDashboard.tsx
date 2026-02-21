"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShoppingCart,
  ShoppingBag,
  Package,
  Calendar,
  Filter,
  Loader2,
  ArrowLeft,
  LogOut,
  ChevronDown,
  Truck,
  Store,
  MapPin,
  Clock,
  User,
  Mail,
  Phone,
  Hash,
  Award,
  Star,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useClientSessionStore } from "@/stores/clientSessionStore";
import { env } from "@/config/env";
import { toast } from "react-toastify";
import type { Order } from "@/features/admin/modules/orders/types";
import { ecommerceConfigService } from "./services/ecommerceConfig";
import type { EcommerceConfigColors } from "./types";

interface ReviewData {
  _id: string;
  orderId: string;
  clientId: string;
  productId: string;
  branchId: string;
  rating: number;
  comment: string;
}

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  "en-proceso": "En Proceso",
  completado: "Completado",
  cancelado: "Cancelado",
  sinAnticipo: "Sin Anticipo",
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pendiente: { bg: "#fef3c7", text: "#d97706" },
  "en-proceso": { bg: "#dbeafe", text: "#2563eb" },
  completado: { bg: "#d1fae5", text: "#059669" },
  cancelado: { bg: "#fee2e2", text: "#dc2626" },
  sinAnticipo: { bg: "#ede9fe", text: "#7c3aed" },
};

const DEFAULT_COLORS: EcommerceConfigColors = {
  primary: "#6366f1",
  secondary: "#10b981",
  background: "#ffffff",
  text: "#1f2937",
};

const EcommerceClientDashboard: React.FC = () => {
  const router = useRouter();
  const { client, token, isAuthenticated, logout, getClientFullName } =
    useClientSessionStore();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [colors, setColors] = useState<EcommerceConfigColors>(DEFAULT_COLORS);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reviews, setReviews] = useState<Record<string, ReviewData>>({});
  const [reviewingItem, setReviewingItem] = useState<{
    orderId: string;
    productId: string;
    productName: string;
  } | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (!isAuthenticated || !client) {
      router.push("/ecommerce-preview");
      return;
    }
    loadOrders();
    loadConfig();
  }, [isAuthenticated, client]);

  const loadConfig = async () => {
    try {
      const response = await ecommerceConfigService.getManagerConfig();
      const { config: configData } = response.data;
      if (configData?.colors) {
        setColors({ ...DEFAULT_COLORS, ...configData.colors });
      }
    } catch (error) {
      console.error("[ClientDashboard] Error loading config:", error);
    }
  };

  const loadOrders = async () => {
    if (!client || !token) {
      console.log("[ClientDashboard] loadOrders aborted - no client or token", { client: !!client, token: !!token });
      return;
    }

    const url = `${env.NEXT_PUBLIC_API_URL}/orders?eOrder=true&clientId=${client._id}&limit=1000&startDate=${filters.startDate}&endDate=${filters.endDate}`;
    console.log("[ClientDashboard] Fetching orders:", url);

    try {
      setLoading(true);
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("[ClientDashboard] Response:", { status: response.status, success: data.success, ordersCount: data.data?.length, data });

      if (data.success) {
        setOrders(data.data);
      } else {
        console.error("[ClientDashboard] API error:", data.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar pedidos");
      console.error("[ClientDashboard] Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    loadOrders();
  };

  const handleLogout = () => {
    logout();
    router.push("/ecommerce-preview");
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);
  };

  const sortedOrders = useMemo(() => {
    return [...orders].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orders]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const loadReviewsForOrder = async (orderId: string) => {
    if (!token) return;
    try {
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/reviews/order/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (data.success && data.data) {
        const map: Record<string, ReviewData> = {};
        data.data.forEach((r: ReviewData) => {
          map[`${r.orderId}_${r.productId}`] = r;
        });
        setReviews((prev) => ({ ...prev, ...map }));
      }
    } catch (error) {
      console.error("[ClientDashboard] Error loading reviews:", error);
    }
  };

  const handleOpenOrder = (order: Order) => {
    setSelectedOrder(order);
    loadReviewsForOrder(order._id);
  };

  const handleSubmitReview = async () => {
    if (!reviewingItem || !token || !selectedOrder || reviewForm.rating === 0) return;

    const branchId =
      typeof selectedOrder.branchId === "string"
        ? selectedOrder.branchId
        : selectedOrder.branchId._id;

    setSubmittingReview(true);
    try {
      const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/reviews`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: reviewingItem.orderId,
          productId: reviewingItem.productId,
          branchId,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Resena enviada exitosamente");
        setReviews((prev) => ({
          ...prev,
          [`${reviewingItem.orderId}_${reviewingItem.productId}`]: data.data,
        }));
        setReviewingItem(null);
        setReviewForm({ rating: 0, comment: "" });
      } else {
        toast.error(data.message || "Error al enviar resena");
      }
    } catch (error: any) {
      toast.error(error.message || "Error al enviar resena");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!isAuthenticated || !client) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
        <div className="shadow-sm border-b" style={{ backgroundColor: colors.primary }}>
          <div className="px-6 py-3 flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">Mis Pedidos</h1>
          </div>
        </div>
        <div className="flex justify-center items-center" style={{ minHeight: "400px" }}>
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.primary }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Topbar */}
      <div className="shadow-sm border-b sticky top-0 z-30" style={{ backgroundColor: colors.primary }}>
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 hover:text-white"
              onClick={() => router.push("/ecommerce-preview")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver a la Tienda
            </Button>
            <div className="h-6 w-px bg-white/30" />
            <h1 className="text-xl font-bold text-white">Mis Pedidos</h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
                style={{ color: "#ffffff", backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }}
              >
                {getClientFullName()}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push("/ecommerce-dashboard")}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Mis Pedidos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/ecommerce-catalog")}>
                <ShoppingBag className="h-4 w-4 mr-2" />
                Realizar Compras
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content with Sidebar */}
      <div className="flex" style={{ height: "calc(100vh - 57px)" }}>
        {/* Client Sidebar */}
        <div className="w-1/4 border-r-2 border-slate-300 bg-white shadow-md p-6 overflow-y-auto">
          <div className="flex flex-col items-center mb-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <span className="text-2xl font-bold" style={{ color: colors.primary }}>
                {client.name.charAt(0)}{client.lastName.charAt(0)}
              </span>
            </div>
            <h2 className="text-lg font-bold text-center">
              {client.name} {client.lastName}
            </h2>
            <Badge variant="secondary" className="mt-1">Cliente</Badge>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
                <Hash className="h-4 w-4 text-slate-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">No. Cliente</p>
                <p className="text-sm font-medium truncate">{client.clientNumber}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4 text-slate-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium truncate">{client.email || "No registrado"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
                <Phone className="h-4 w-4 text-slate-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Telefono</p>
                <p className="text-sm font-medium">{client.phoneNumber || "No registrado"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <Award className="h-4 w-4 text-amber-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Puntos</p>
                <p className="text-sm font-bold text-amber-600">{client.points.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Order Stats */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <h3 className="text-sm font-semibold mb-3">Resumen</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total pedidos</span>
                <span className="font-medium">{orders.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total gastado</span>
                <span className="font-medium">
                  {formatCurrency(orders.reduce((sum, o) => sum + (o.total || 0), 0))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Content */}
        <div className="w-3/4 py-3 px-4 overflow-y-auto">
          {/* Filters */}
          <div className="flex items-center gap-2 mb-3 flex-wrap border rounded-lg px-3 py-2">
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
              className="w-36 h-8 text-sm"
            />
            <span className="text-xs text-muted-foreground">a</span>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
              className="w-36 h-8 text-sm"
            />
            <Button
              size="sm"
              className="h-8 text-white"
              style={{ backgroundColor: colors.primary }}
              onClick={handleApplyFilters}
              disabled={loading}
            >
              <Filter className="w-3.5 h-3.5 mr-1" />
              {loading ? "..." : "Aplicar"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => {
                const now = new Date();
                const firstDay = new Date(
                  now.getFullYear(),
                  now.getMonth(),
                  1
                );
                setFilters({
                  startDate: firstDay.toISOString().split("T")[0],
                  endDate: now.toISOString().split("T")[0],
                });
              }}
            >
              Mes Actual
            </Button>
          </div>

        {/* Orders count */}
        <p className="text-sm text-muted-foreground mb-3">
          {loading
            ? "Cargando pedidos..."
            : `Mostrando ${sortedOrders.length} pedido${sortedOrders.length !== 1 ? "s" : ""}`}
        </p>

        {/* Order List */}
        {sortedOrders.length === 0 && !loading ? (
          <Card className="shadow-sm">
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <Package size={56} className="mb-4 opacity-40" />
                <p className="text-lg font-medium mb-1">No tienes pedidos aun</p>
                <p className="text-sm mb-4">Tus pedidos apareceran aqui cuando realices una compra</p>
                <Button
                  className="text-white"
                  style={{ backgroundColor: colors.primary }}
                  onClick={() => router.push("/ecommerce-catalog")}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Ir a Comprar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedOrders.map((order) => {
              const statusStyle = STATUS_STYLES[order.status] || { bg: "#f3f4f6", text: "#6b7280" };
              const visibleItems = order.items.slice(0, 4);
              const remainingItems = order.items.length - 4;

              return (
                <Card key={order._id} className="shadow-sm overflow-hidden">
                  <CardContent className="p-0">
                    {/* Order Summary */}
                    <div className="p-4">
                      {/* Top row: order number, date, status */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-sm">
                            {order.orderNumber || "Sin numero"}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(order.createdAt)}
                          </span>
                        </div>
                        <Badge
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                          className="text-xs"
                        >
                          {STATUS_LABELS[order.status] || order.status}
                        </Badge>
                      </div>

                      {/* Products row */}
                      <div className="flex flex-wrap gap-3 mb-3">
                        {visibleItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2"
                          >
                            <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center shrink-0">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate max-w-[150px]">
                                {item.productName || "Producto"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                x{item.quantity}
                              </p>
                            </div>
                          </div>
                        ))}
                        {remainingItems > 0 && (
                          <div className="flex items-center justify-center bg-gray-50 rounded-lg px-3 py-2">
                            <span className="text-sm text-muted-foreground font-medium">
                              +{remainingItems} mas
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Bottom row: shipping, total, detail button */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            {order.shippingType === "envio" ? (
                              <>
                                <Truck className="h-4 w-4" />
                                <span>Envio a domicilio</span>
                              </>
                            ) : (
                              <>
                                <Store className="h-4 w-4" />
                                <span>Recoger en tienda</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-base">
                            {formatCurrency(order.total)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenOrder(order)}
                            style={{ color: colors.primary }}
                          >
                            Ver Detalle
                          </Button>
                        </div>
                      </div>
                    </div>

                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        </div>
      </div>

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => {
        if (!open) {
          setSelectedOrder(null);
          setReviewingItem(null);
          setReviewForm({ rating: 0, comment: "" });
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedOrder && (() => {
            const order = selectedOrder;
            const statusStyle = STATUS_STYLES[order.status] || { bg: "#f3f4f6", text: "#6b7280" };
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between pr-6">
                    <DialogTitle className="text-lg">
                      {order.orderNumber || "Sin numero"}
                    </DialogTitle>
                    <Badge
                      style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                      className="text-xs"
                    >
                      {STATUS_LABELS[order.status] || order.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </p>
                </DialogHeader>

                {/* Products table */}
                <div className="rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                          Producto
                        </th>
                        <th className="text-center py-2 px-3 font-medium text-muted-foreground">
                          Cant.
                        </th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">
                          Precio Unit.
                        </th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">
                          Subtotal
                        </th>
                        <th className="text-center py-2 px-3 font-medium text-muted-foreground">
                          Resena
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, idx) => {
                        const reviewKey = `${order._id}_${item.productId}`;
                        const existingReview = reviews[reviewKey];
                        return (
                          <tr key={idx} className="border-b last:border-0">
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center shrink-0">
                                  <Package className="h-4 w-4 text-gray-400" />
                                </div>
                                <span className="font-medium">
                                  {item.productName || "Producto"}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {item.quantity}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium">
                              {formatCurrency(item.amount)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {existingReview ? (
                                <div className="flex items-center justify-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      className={`h-3.5 w-3.5 ${
                                        s <= existingReview.rating
                                          ? "fill-amber-400 text-amber-400"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7"
                                  onClick={() => {
                                    setReviewingItem({
                                      orderId: order._id,
                                      productId: item.productId || "",
                                      productName: item.productName || "Producto",
                                    });
                                    setReviewForm({ rating: 0, comment: "" });
                                  }}
                                >
                                  <Star className="h-3 w-3 mr-1" />
                                  Resenar
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Review Form */}
                {reviewingItem && reviewingItem.orderId === order._id && (
                  <div className="rounded-lg border p-4 bg-amber-50/50">
                    <h5 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                      <Star className="h-4 w-4 text-amber-500" />
                      Resenar: {reviewingItem.productName}
                    </h5>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Calificacion</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setReviewForm((f) => ({ ...f, rating: s }))}
                              className="p-0.5 hover:scale-110 transition-transform"
                            >
                              <Star
                                className={`h-6 w-6 ${
                                  s <= reviewForm.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-gray-300 hover:text-amber-300"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">
                          Comentario (opcional, max 500 caracteres)
                        </p>
                        <Textarea
                          value={reviewForm.comment}
                          onChange={(e) =>
                            setReviewForm((f) => ({
                              ...f,
                              comment: e.target.value.slice(0, 500),
                            }))
                          }
                          placeholder="Escribe tu experiencia con este producto..."
                          className="min-h-[80px] bg-white"
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-right">
                          {reviewForm.comment.length}/500
                        </p>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReviewingItem(null);
                            setReviewForm({ rating: 0, comment: "" });
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          className="text-white"
                          style={{ backgroundColor: colors.primary }}
                          onClick={handleSubmitReview}
                          disabled={reviewForm.rating === 0 || submittingReview}
                        >
                          {submittingReview ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          ) : (
                            <Star className="h-3.5 w-3.5 mr-1" />
                          )}
                          Enviar Resena
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Delivery info */}
                  {order.shippingType === "envio" && order.deliveryData && (
                    <div className="rounded-lg border p-4">
                      <h5 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                        <Truck className="h-4 w-4" />
                        Informacion de Entrega
                      </h5>
                      <div className="space-y-1.5 text-sm">
                        {order.deliveryData.recipientName && (
                          <p>
                            <span className="text-muted-foreground">Destinatario:</span>{" "}
                            {order.deliveryData.recipientName}
                          </p>
                        )}
                        {order.deliveryData.street && (
                          <p className="flex items-start gap-1">
                            <MapPin className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                            {order.deliveryData.street}
                          </p>
                        )}
                        {order.deliveryData.deliveryDateTime && (
                          <p className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatDateTime(order.deliveryData.deliveryDateTime)}
                          </p>
                        )}
                        {order.deliveryData.message && (
                          <p>
                            <span className="text-muted-foreground">Nota:</span>{" "}
                            {order.deliveryData.message}
                          </p>
                        )}
                        {order.deliveryData.reference && (
                          <p>
                            <span className="text-muted-foreground">Referencia:</span>{" "}
                            {order.deliveryData.reference}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {order.shippingType !== "envio" && (
                    <div className="rounded-lg border p-4">
                      <h5 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                        <Store className="h-4 w-4" />
                        Tipo de Entrega
                      </h5>
                      <p className="text-sm">Recoger en tienda</p>
                    </div>
                  )}

                  {/* Payment summary */}
                  <div className="rounded-lg border p-4">
                    <h5 className="font-semibold text-sm mb-2">
                      Resumen de Pago
                    </h5>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(order.subtotal)}</span>
                      </div>
                      {order.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Descuento</span>
                          <span>-{formatCurrency(order.discount)}</span>
                        </div>
                      )}
                      {order.deliveryData?.deliveryPrice != null &&
                        order.deliveryData.deliveryPrice > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Envio</span>
                            <span>
                              {formatCurrency(order.deliveryData.deliveryPrice)}
                            </span>
                          </div>
                        )}
                      <div className="flex justify-between font-bold border-t pt-1.5">
                        <span>Total</span>
                        <span>{formatCurrency(order.total)}</span>
                      </div>
                      {order.advance > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Anticipo pagado</span>
                          <span>{formatCurrency(order.advance)}</span>
                        </div>
                      )}
                      {order.remainingBalance > 0 && (
                        <div className="flex justify-between text-amber-600 font-medium">
                          <span>Saldo pendiente</span>
                          <span>{formatCurrency(order.remainingBalance)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order date */}
                <p className="text-xs text-muted-foreground">
                  Pedido realizado el {formatDateTime(order.createdAt)}
                </p>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EcommerceClientDashboard;
