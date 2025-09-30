"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import { clientsService } from "@/features/admin/modules/clients/services/clients";
import { Client } from "@/features/admin/modules/clients/types";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge, Button, Table } from "react-bootstrap";
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
    usuario: "Admin", // Aquí puedes obtener el usuario actual del contexto
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
    <div className="container-fluid">
      <PageBreadcrumb
        title="Detalle de Usuario"
        subtitle="Clientes"
        section="Admin"
      />

      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              {loading && (
                <div className="text-center py-4">
                  <div
                    className="spinner-border text-primary mb-2"
                    role="status"
                  />
                  <div className="text-muted small">
                    Cargando información...
                  </div>
                </div>
              )}

              {!loading && client && (
                <>
                  <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="position-relative"
                        style={{ width: 72, height: 72 }}
                      >
                        {!avatarError ? (
                          <img
                            src={`/assets/images/clients/0${avatarIndex}.svg`}
                            alt="avatar"
                            width={72}
                            height={72}
                            className="rounded-circle border object-fit-cover"
                            onError={() => setAvatarError(true)}
                          />
                        ) : (
                          <div
                            className="bg-primary text-white d-flex align-items-center justify-content-center rounded-circle border"
                            style={{ width: 72, height: 72, fontSize: 28 }}
                          >
                            {client.fullName?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {client.status && (
                          <span
                            className="position-absolute translate-middle p-1 bg-warning rounded-circle"
                            style={{ left: 62, top: 10 }}
                          />
                        )}
                      </div>
                      <div>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <h5 className="mb-0">{client.fullName}</h5>
                          <Badge bg={client.status ? "success" : "secondary"}>
                            {client.status ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                        <div className="">Cliente</div>
                      </div>
                    </div>
                    <div>
                      <Button
                        variant="outline-secondary"
                        onClick={() => router.push("/panel/clientes")}
                      >
                        Volver a la lista
                      </Button>
                    </div>
                  </div>

                  <div className="row g-3 mt-4">
                    <div className="col-12 col-sm-6 col-lg-3">
                      <div className="d-flex align-items-center gap-2 h-100 p-3 border rounded-3 bg-light">
                        <div className="btn btn-light btn-icon rounded-circle p-2 d-inline-flex align-items-center justify-content-center">
                          <Phone size={18} className="text-primary" />
                        </div>
                        <div>
                          <div className="">Teléfono</div>
                          <div className="fw-semibold">
                            {client.phoneNumber || "Sin teléfono"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-sm-6 col-lg-3">
                      <div className="d-flex align-items-center gap-2 h-100 p-3 border rounded-3 bg-light">
                        <div className="btn btn-light btn-icon rounded-circle p-2 d-inline-flex align-items-center justify-content-center">
                          <CreditCard size={18} className="text-primary" />
                        </div>
                        <div>
                          <div className="">Número de cliente</div>
                          <Badge bg="secondary" className="fs-6">
                            {client.clientNumber}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-sm-6 col-lg-3">
                      <div className="d-flex align-items-center gap-2 h-100 p-3 border rounded-3 bg-light">
                        <div className="btn btn-light btn-icon rounded-circle p-2 d-inline-flex align-items-center justify-content-center">
                          <Award size={18} className="text-warning" />
                        </div>
                        <div>
                          <div className="">Puntos</div>
                          <div className="fw-semibold">{client.points}</div>
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-sm-6 col-lg-3">
                      <div className="d-flex align-items-center gap-2 h-100 p-3 border rounded-3 bg-light">
                        <div className="btn btn-light btn-icon rounded-circle p-2 d-inline-flex align-items-center justify-content-center">
                          <ShoppingBag size={18} className="text-info" />
                        </div>
                        <div>
                          <div className="">Compras realizadas</div>
                          <div className="fw-semibold">
                            {client.purchases.length}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center justify-content-between pt-3 mt-2 border-top">
                    <div className="text-muted small d-flex align-items-center gap-2">
                      <RefreshCw size={14} /> Actualizado{" "}
                      {timeAgo(client.updatedAt)} ago
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {client && !loading && (
        <div className="row mt-3">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h4 className="mb-0 md">Compras realizadas</h4>
                  <div className="text-muted small">
                    Total: {client.purchases.length}
                  </div>
                </div>
                <div className="table-responsive border rounded-3 shadow-sm">
                  <Table
                    className="table table-custom table-centered table-hover table-bordered border w-100 mb-0"
                    style={{ fontSize: 14 }}
                  >
                    <thead className="bg-light align-middle bg-opacity-25">
                      <tr>
                        <th>No.</th>
                        <th>Entregado a</th>
                        <th>Fecha</th>
                        <th>Estatus proceso</th>
                        <th>Estatus pago</th>
                        <th>Sucursal</th>
                        <th className="text-end">Total</th>
                        <th className="text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {client.purchases.length === 0 && (
                        <tr className="text-muted">
                          <td>—</td>
                          <td>Sin compras</td>
                          <td>—</td>
                          <td>
                            <span className="badge bg-secondary bg-opacity-10 text-secondary">
                              —
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-secondary bg-opacity-10 text-secondary">
                              —
                            </span>
                          </td>
                          <td>—</td>
                          <td className="text-end">—</td>
                          <td className="text-center">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              disabled
                              className="d-inline-flex align-items-center gap-1"
                            >
                              <ChevronDown size={16} />
                            </Button>
                          </td>
                        </tr>
                      )}
                      {client.purchases.length > 0 &&
                        client.purchases.map((p: any, idx: number) => (
                          <tr key={p._id || idx}>
                            <td>{idx + 1}</td>
                            <td className="fw-medium">{p.addressee}</td>
                            <td>{formatDateTime(p.date)}</td>
                            <td>
                              <span
                                className={`badge ${
                                  p.processStatus === "completed"
                                    ? "bg-success bg-opacity-10 text-success"
                                    : p.processStatus === "processing"
                                    ? "bg-warning bg-opacity-10 text-warning"
                                    : p.processStatus === "cancelled"
                                    ? "bg-danger bg-opacity-10 text-danger"
                                    : "bg-secondary bg-opacity-10 text-secondary"
                                }`}
                              >
                                {p.processStatus === "completed"
                                  ? "Entregado"
                                  : p.processStatus === "processing"
                                  ? "En proceso"
                                  : p.processStatus === "cancelled"
                                  ? "Cancelado"
                                  : "Pendiente"}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  p.processPayment === "paid"
                                    ? "bg-success bg-opacity-10 text-success"
                                    : p.processPayment === "failed"
                                    ? "bg-danger bg-opacity-10 text-danger"
                                    : p.processPayment === "refunded"
                                    ? "bg-info bg-opacity-10 text-info"
                                    : "bg-secondary bg-opacity-10 text-secondary"
                                }`}
                              >
                                {p.processPayment === "paid"
                                  ? "Pagado"
                                  : p.processPayment === "failed"
                                  ? "Fallido"
                                  : p.processPayment === "refunded"
                                  ? "Reembolsado"
                                  : "Pendiente"}
                              </span>
                            </td>
                            <td>{p.branch}</td>
                            <td className="text-end">{formatMoney(p.total)}</td>
                            <td className="text-center">
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                className="d-inline-flex align-items-center gap-1"
                              >
                                <ChevronDown size={16} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {client && !loading && (
        <div className="row mt-3">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <MessageSquare size={20} className="text-primary" />
                  <h4 className="mb-0">Comentarios de seguimiento</h4>
                </div>

                <div className="p-3 bg-light rounded-3 mb-4">
                  <div className="d-flex align-items-start gap-3">
                    <div
                      className="bg-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: "40px", height: "40px" }}
                    >
                      <MessageSquare size={20} className="text-white" />
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-2">
                        Agregar comentario de seguimiento
                      </h6>
                      <div className="row g-2">
                        <div className="col-md-8">
                          <textarea
                            className="form-control"
                            rows={3}
                            placeholder="Escribe tu comentario de seguimiento aquí..."
                            style={{ resize: "none" }}
                            value={commentData.comentario}
                            onChange={(e) =>
                              setCommentData({
                                ...commentData,
                                comentario: e.target.value,
                              })
                            }
                            maxLength={500}
                          />
                          <small className="text-muted">
                            {commentData.comentario.length}/500 caracteres
                          </small>
                        </div>
                        <div className="col-md-4">
                          <select
                            className="form-select mb-2"
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
                            variant="primary"
                            className="w-100 d-flex align-items-center justify-content-center gap-2"
                            onClick={handleAddComment}
                            disabled={
                              addingComment ||
                              !commentData.comentario.trim() ||
                              !commentData.tipo
                            }
                          >
                            {addingComment ? (
                              <>
                                <div
                                  className="spinner-border spinner-border-sm"
                                  role="status"
                                />
                                Guardando...
                              </>
                            ) : (
                              <>
                                <Plus size={16} />
                                Guardar comentario
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="table-responsive border rounded-3 shadow-sm">
                  <Table className="table table-custom table-centered table-hover table-bordered border w-100 mb-0">
                    <thead className="bg-light align-middle bg-opacity-25">
                      <tr>
                        <th style={{ width: "60px" }}>#</th>
                        <th>Comentario</th>
                        <th style={{ width: "180px" }}>Usuario</th>
                        <th style={{ width: "150px" }}>Fecha</th>
                        <th style={{ width: "120px" }}>Tipo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {client.comentarios && client.comentarios.length === 0 ? (
                        <tr className="text-muted">
                          <td className="text-center">
                            <div className="d-flex align-items-center justify-content-center">
                              <div
                                className="bg-light rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: "32px", height: "32px" }}
                              >
                                <MessageSquare
                                  size={16}
                                  className="text-muted"
                                />
                              </div>
                            </div>
                          </td>
                          <td className="text-center py-4">
                            <div className="text-muted">
                              <MessageSquare
                                size={24}
                                className="mb-2 opacity-50"
                              />
                              <div>No hay comentarios de seguimiento</div>
                              <small className="text-muted">
                                Agrega el primer comentario para comenzar el
                                seguimiento
                              </small>
                            </div>
                          </td>
                          <td>—</td>
                          <td>—</td>
                          <td>—</td>
                        </tr>
                      ) : (
                        client.comentarios?.map((comment, index) => (
                          <tr key={comment._id || index}>
                            <td className="text-center">
                              <div className="d-flex align-items-center justify-content-center">
                                <div
                                  className={`rounded-circle d-flex align-items-center justify-content-center ${
                                    comment.tipo === "positive"
                                      ? "bg-success bg-opacity-10"
                                      : "bg-danger bg-opacity-10"
                                  }`}
                                  style={{ width: "32px", height: "32px" }}
                                >
                                  <MessageSquare
                                    size={16}
                                    className={
                                      comment.tipo === "positive"
                                        ? "text-success"
                                        : "text-danger"
                                    }
                                  />
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="fw-medium mb-1">
                                {comment.comentario}
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  className="bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                                  style={{
                                    width: "24px",
                                    height: "24px",
                                    borderRadius: "50%",
                                    fontSize: "12px",
                                  }}
                                >
                                  {comment.usuario.charAt(0).toUpperCase()}
                                </div>
                                <span className="fw-medium">
                                  {comment.usuario}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className="text-muted small">
                                {formatDateTime(comment.fechaCreacion)}
                              </div>
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  comment.tipo === "positive"
                                    ? "bg-success bg-opacity-10 text-success"
                                    : "bg-danger bg-opacity-10 text-danger"
                                }`}
                              >
                                {comment.tipo === "positive"
                                  ? "Positivo"
                                  : "Negativo"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
