"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import { clientsService } from "@/features/admin/modules/clients/services/clients";
import { Client } from "@/features/admin/modules/clients/types";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "react-toastify";
import {
  Phone,
  CreditCard,
  Award,
  ShoppingBag,
  RefreshCw,
  ChevronDown,
  MessageSquare,
  Plus,
  Loader2,
} from "lucide-react";

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [avatarError, setAvatarError] = useState<boolean>(false);
  const [commentData, setCommentData] = useState({
    comentario: "",
    tipo: "" as "positive" | "negative" | "",
    usuario: "Admin",
  });
  const [addingComment, setAddingComment] = useState<boolean>(false);

  const timeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h`;
    const days = Math.floor(hours / 24);
    return `${days} d`;
  };

  const avatarIndex = useMemo(() => {
    if (!params?.id) return 1;
    const sum = Array.from(params.id).reduce(
      (acc, ch) => acc + ch.charCodeAt(0),
      0
    );
    return (sum % 7) + 1;
  }, [params?.id]);

  const formatDateTime = (d: string | Date) => {
    return new Date(d).toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value || 0);

  const handleAddComment = async () => {
    if (!params?.id || !commentData.comentario.trim() || !commentData.tipo) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    try {
      setAddingComment(true);
      const response = await clientsService.addComment(params.id, {
        comentario: commentData.comentario.trim(),
        tipo: commentData.tipo,
        usuario: commentData.usuario,
      });

      if (response.success) {
        setClient(response.data.client);
        setCommentData({
          comentario: "",
          tipo: "",
          usuario: "Admin",
        });
        toast.success("Comentario agregado exitosamente");
      }
    } catch (error: any) {
      toast.error(error.message || "Error al agregar el comentario");
      console.error("Error adding comment:", error);
    } finally {
      setAddingComment(false);
    }
  };

  useEffect(() => {
    const fetchClient = async () => {
      if (!params?.id) return;
      try {
        setLoading(true);
        const response = await clientsService.getClientById(params.id);
        if (response.success) {
          setClient(response.data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [params?.id]);

  return (
    <div className="w-full px-4">
      <PageBreadcrumb
        title="Detalle de Usuario"
        subtitle="Clientes"
        section="Admin"
      />

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-card rounded-lg border shadow-sm">
          <div className="p-6">
            {loading && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <div className="text-muted-foreground text-sm">
                  Cargando información...
                </div>
              </div>
            )}

            {!loading && client && (
              <>
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-[72px] h-[72px]">
                      {!avatarError ? (
                        <img
                          src={`/assets/images/clients/0${avatarIndex}.svg`}
                          alt="avatar"
                          width={72}
                          height={72}
                          className="rounded-full border object-cover"
                          onError={() => setAvatarError(true)}
                        />
                      ) : (
                        <div className="bg-primary text-primary-foreground flex items-center justify-center rounded-full border w-[72px] h-[72px] text-2xl font-semibold">
                          {client.fullName?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {client.status && (
                        <span className="absolute w-3 h-3 bg-yellow-500 rounded-full top-1 right-1" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="text-xl font-semibold">{client.fullName}</h5>
                        <Badge variant={client.status ? "default" : "secondary"}>
                          {client.status ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground">Cliente</div>
                    </div>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/panel/clientes")}
                    >
                      Volver a la lista
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  <div className="flex items-center gap-3 h-full p-4 border rounded-lg bg-muted/50">
                    <div className="p-2 rounded-full bg-background">
                      <Phone size={18} className="text-primary" />
                    </div>
                    <div>
                      <div className="text-muted-foreground text-sm">Teléfono</div>
                      <div className="font-semibold">
                        {client.phoneNumber || "Sin teléfono"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 h-full p-4 border rounded-lg bg-muted/50">
                    <div className="p-2 rounded-full bg-background">
                      <CreditCard size={18} className="text-primary" />
                    </div>
                    <div>
                      <div className="text-muted-foreground text-sm">Número de cliente</div>
                      <Badge variant="secondary">{client.clientNumber}</Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 h-full p-4 border rounded-lg bg-muted/50">
                    <div className="p-2 rounded-full bg-background">
                      <Award size={18} className="text-yellow-500" />
                    </div>
                    <div>
                      <div className="text-muted-foreground text-sm">Puntos</div>
                      <div className="font-semibold">{client.points}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 h-full p-4 border rounded-lg bg-muted/50">
                    <div className="p-2 rounded-full bg-background">
                      <ShoppingBag size={18} className="text-blue-500" />
                    </div>
                    <div>
                      <div className="text-muted-foreground text-sm">Compras realizadas</div>
                      <div className="font-semibold">{client.purchases.length}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t">
                  <div className="text-muted-foreground text-sm flex items-center gap-2">
                    <RefreshCw size={14} /> Actualizado {timeAgo(client.updatedAt)} ago
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {client && !loading && (
        <div className="mt-4">
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold">Compras realizadas</h4>
                <div className="text-muted-foreground text-sm">
                  Total: {client.purchases.length}
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>No.</TableHead>
                      <TableHead>Entregado a</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Estatus proceso</TableHead>
                      <TableHead>Estatus pago</TableHead>
                      <TableHead>Sucursal</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.purchases.length === 0 && (
                      <TableRow className="text-muted-foreground">
                        <TableCell>—</TableCell>
                        <TableCell>Sin compras</TableCell>
                        <TableCell>—</TableCell>
                        <TableCell>
                          <Badge variant="secondary">—</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">—</Badge>
                        </TableCell>
                        <TableCell>—</TableCell>
                        <TableCell className="text-right">—</TableCell>
                        <TableCell className="text-center">
                          <Button variant="outline" size="sm" disabled>
                            <ChevronDown size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                    {client.purchases.length > 0 &&
                      client.purchases.map((p: any, idx: number) => (
                        <TableRow key={p._id || idx}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell className="font-medium">{p.addressee}</TableCell>
                          <TableCell>{formatDateTime(p.date)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                p.processStatus === "completed"
                                  ? "default"
                                  : p.processStatus === "cancelled"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className={
                                p.processStatus === "completed"
                                  ? "bg-green-500"
                                  : p.processStatus === "processing"
                                  ? "bg-yellow-500"
                                  : ""
                              }
                            >
                              {p.processStatus === "completed"
                                ? "Entregado"
                                : p.processStatus === "processing"
                                ? "En proceso"
                                : p.processStatus === "cancelled"
                                ? "Cancelado"
                                : "Pendiente"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                p.processPayment === "paid"
                                  ? "default"
                                  : p.processPayment === "failed"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className={
                                p.processPayment === "paid" ? "bg-green-500" : ""
                              }
                            >
                              {p.processPayment === "paid"
                                ? "Pagado"
                                : p.processPayment === "failed"
                                ? "Fallido"
                                : p.processPayment === "refunded"
                                ? "Reembolsado"
                                : "Pendiente"}
                            </Badge>
                          </TableCell>
                          <TableCell>{p.branch}</TableCell>
                          <TableCell className="text-right">{formatMoney(p.total)}</TableCell>
                          <TableCell className="text-center">
                            <Button variant="outline" size="sm">
                              <ChevronDown size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      )}

      {client && !loading && (
        <div className="mt-4">
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare size={20} className="text-primary" />
                <h4 className="text-lg font-semibold">Comentarios de seguimiento</h4>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg mb-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary rounded-full flex items-center justify-center flex-shrink-0 w-10 h-10">
                    <MessageSquare size={20} className="text-primary-foreground" />
                  </div>
                  <div className="flex-grow">
                    <h6 className="font-semibold mb-2">Agregar comentario de seguimiento</h6>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <textarea
                          className="w-full p-3 border rounded-lg resize-none bg-background"
                          rows={3}
                          placeholder="Escribe tu comentario de seguimiento aquí..."
                          value={commentData.comentario}
                          onChange={(e) =>
                            setCommentData({
                              ...commentData,
                              comentario: e.target.value,
                            })
                          }
                          maxLength={500}
                        />
                        <small className="text-muted-foreground">
                          {commentData.comentario.length}/500 caracteres
                        </small>
                      </div>
                      <div className="space-y-2">
                        <select
                          className="w-full p-2 border rounded-lg bg-background"
                          value={commentData.tipo}
                          onChange={(e) =>
                            setCommentData({
                              ...commentData,
                              tipo: e.target.value as "positive" | "negative",
                            })
                          }
                        >
                          <option value="">Seleccionar tipo</option>
                          <option value="positive">Positivo</option>
                          <option value="negative">Negativo</option>
                        </select>
                        <Button
                          className="w-full"
                          onClick={handleAddComment}
                          disabled={
                            addingComment ||
                            !commentData.comentario.trim() ||
                            !commentData.tipo
                          }
                        >
                          {addingComment ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Guardando...
                            </>
                          ) : (
                            <>
                              <Plus size={16} className="mr-2" />
                              Guardar comentario
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>Comentario</TableHead>
                      <TableHead className="w-44">Usuario</TableHead>
                      <TableHead className="w-40">Fecha</TableHead>
                      <TableHead className="w-28">Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.comentarios && client.comentarios.length === 0 ? (
                      <TableRow className="text-muted-foreground">
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <div className="bg-muted rounded-full flex items-center justify-center w-8 h-8">
                              <MessageSquare size={16} className="text-muted-foreground" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-8">
                          <div className="text-muted-foreground">
                            <MessageSquare size={24} className="mx-auto mb-2 opacity-50" />
                            <div>No hay comentarios de seguimiento</div>
                            <small className="text-muted-foreground">
                              Agrega el primer comentario para comenzar el seguimiento
                            </small>
                          </div>
                        </TableCell>
                        <TableCell>—</TableCell>
                        <TableCell>—</TableCell>
                        <TableCell>—</TableCell>
                      </TableRow>
                    ) : (
                      client.comentarios?.map((comment, index) => (
                        <TableRow key={comment._id || index}>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center">
                              <div
                                className={`rounded-full flex items-center justify-center w-8 h-8 ${
                                  comment.tipo === "positive"
                                    ? "bg-green-100"
                                    : "bg-red-100"
                                }`}
                              >
                                <MessageSquare
                                  size={16}
                                  className={
                                    comment.tipo === "positive"
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{comment.comentario}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="bg-primary text-primary-foreground flex items-center justify-center font-bold w-6 h-6 rounded-full text-xs">
                                {comment.usuario.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium">{comment.usuario}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-muted-foreground text-sm">
                              {formatDateTime(comment.fechaCreacion)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={comment.tipo === "positive" ? "default" : "destructive"}
                              className={comment.tipo === "positive" ? "bg-green-500" : ""}
                            >
                              {comment.tipo === "positive" ? "Positivo" : "Negativo"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
