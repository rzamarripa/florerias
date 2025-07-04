import React, { useEffect, useState } from "react";
import { getCashPayments, updateCashPayment, deleteCashPayment } from "./services/cashPayments";
import { CashPayment, CashPaymentFormData } from "./types";
import { CashPaymentModal } from "./components/CashPaymentModal";
import { Table, Button, Spinner, Alert, Card, OverlayTrigger, Tooltip } from "react-bootstrap";
import { BsPencil, BsTrash } from "react-icons/bs";
import { useUserSessionStore } from '@/stores/userSessionStore';
import { toast } from "react-toastify";

const PAGE_SIZE = 10;

const CashPaymentsPage: React.FC = () => {
    const [payments, setPayments] = useState<CashPayment[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<CashPayment | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 });
    const { user } = useUserSessionStore();
    const departmentId = user?.departmentId;

    const fetchPayments = async (page = 1) => {
        setLoading(true);
        setError(null);
        try {
            const res = await getCashPayments({ page, limit: pagination.limit });
            setPayments(res.data);
            if (res.pagination) setPagination(res.pagination);
        } catch (e: any) {
            setError(e?.message || "Error al cargar pagos");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPayments(1);
    }, []);

    const handlePageChange = (page: number) => {
        fetchPayments(page);
    };

    const getPageNumbers = () => {
        const { page, pages } = pagination;
        const delta = 2;
        const range = [];
        const rangeWithDots = [];
        for (let i = Math.max(2, page - delta); i <= Math.min(pages - 1, page + delta); i++) {
            range.push(i);
        }
        if (page - delta > 2) {
            rangeWithDots.push(1, '...');
        } else {
            rangeWithDots.push(1);
        }
        rangeWithDots.push(...range);
        if (page + delta < pages - 1) {
            rangeWithDots.push('...', pages);
        } else if (pages > 1) {
            rangeWithDots.push(pages);
        }
        return rangeWithDots;
    };

    const handleAdd = async (data: CashPaymentFormData) => {
        // Si es edición, usar el flujo original
        if (editingPayment) {
            setLoading(true);
            setError(null);
            try {
                await updateCashPayment(editingPayment._id, data);
                setEditingPayment(null);
                setModalOpen(false);
                toast.success("Pago actualizado correctamente");
                fetchPayments(pagination.page);
            } catch (e: any) {
                setError(e?.message || "Error al actualizar pago");
                toast.error(e?.message || "Error al actualizar pago");
            }
            setLoading(false);
        } else {
            // Si es creación, el modal maneja todo el flujo
            // Solo necesitamos actualizar la lista
            setModalOpen(false);
            toast.success("Pago creado correctamente");
            fetchPayments(pagination.page);
        }
    };

    const handleEdit = async (data: CashPaymentFormData) => {
        if (!editingPayment) return;
        setLoading(true);
        setError(null);
        try {
            await updateCashPayment(editingPayment._id, data);
            setEditingPayment(null);
            setModalOpen(false);
            toast.success("Pago actualizado correctamente");
            fetchPayments(pagination.page);
        } catch (e: any) {
            setError(e?.message || "Error al actualizar pago");
            toast.error(e?.message || "Error al actualizar pago");
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("¿Seguro que deseas eliminar este pago?")) return;
        setLoading(true);
        setError(null);
        try {
            await deleteCashPayment(id);
            toast.success("Pago eliminado correctamente");
            fetchPayments(pagination.page);
        } catch (e: any) {
            setError(e?.message || "Error al eliminar pago");
            toast.error(e?.message || "Error al eliminar pago");
        }
        setLoading(false);
    };

    const openEditModal = (payment: CashPayment) => {
        setEditingPayment(payment);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingPayment(null);
    };

    return (
        <div className="row">
            <div className="col-12">
                <Card>
                    <Card.Header className="border-light d-flex justify-content-between align-items-center py-3">
                        <div className="fw-bold fs-5">Pagos en efectivo</div>
                        <Button variant="primary" onClick={() => { setModalOpen(true); setEditingPayment(null); }}>
                            + Agregar gasto en efectivo
                        </Button>
                    </Card.Header>
                    <div className="table-responsive shadow-sm">
                        <Table className="table table-custom table-centered table-hover w-100 mb-0">
                            <thead className="bg-light align-middle bg-opacity-25 thead-sm">
                                <tr>
                                    <th>#</th>
                                    <th>Importe</th>
                                    <th>Concepto</th>
                                    <th>Descripción</th>
                                    <th>Estatus</th>
                                    <th>Fecha</th>
                                    <th className="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-4">
                                            <div className="d-flex flex-column align-items-center">
                                                <Spinner animation="border" variant="primary" className="mb-2" />
                                                <p className="text-muted mb-0 small">Cargando pagos...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-4">
                                            <Alert variant="danger" className="mb-0">{error}</Alert>
                                        </td>
                                    </tr>
                                ) : (Array.isArray(payments) ? payments : []).length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-4 text-muted">
                                            No hay pagos registrados
                                        </td>
                                    </tr>
                                ) : (
                                    (Array.isArray(payments) ? payments : []).map((p, idx) => (
                                        <tr key={p._id}>
                                            <td>{(pagination.page - 1) * pagination.limit + idx + 1}</td>
                                            <td>{p.importeAPagar.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}</td>
                                            <td>{p.expenseConcept?.categoryId?.name ? `${p.expenseConcept.categoryId.name} - ` : ""}{p.expenseConcept?.name}</td>
                                            <td>{p.description}</td>
                                            <td>
                                                {(() => {
                                                    let text = '';
                                                    let variant = '';
                                                    switch (p.estadoPago) {
                                                        case 0:
                                                        default:
                                                            text = 'Pendiente';
                                                            variant = 'secondary';
                                                            break;
                                                        case 1:
                                                            text = 'Enviado a pago';
                                                            variant = 'info';
                                                            break;
                                                        case 2:
                                                            text = 'Pagado';
                                                            variant = 'success';
                                                            break;
                                                        case 3:
                                                            text = 'Registrado';
                                                            variant = 'primary';
                                                            break;
                                                    }
                                                    return <span className={`badge bg-${variant}`}>{text}</span>;
                                                })()}
                                            </td>
                                            <td>{new Date(p.createdAt).toLocaleDateString("es-MX")}</td>
                                            <td className="text-center">
                                                <OverlayTrigger placement="top" overlay={<Tooltip>Editar</Tooltip>}>
                                                    <Button variant="light" size="sm" className="me-2" onClick={() => openEditModal(p)}>
                                                        <BsPencil size={16} />
                                                    </Button>
                                                </OverlayTrigger>
                                                <OverlayTrigger placement="top" overlay={<Tooltip>Eliminar</Tooltip>}>
                                                    <Button variant="light" size="sm" onClick={() => handleDelete(p._id)}>
                                                        <BsTrash size={16} />
                                                    </Button>
                                                </OverlayTrigger>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>
                    {/* Paginación */}
                    <div className="d-flex justify-content-between align-items-center p-3 border-top">
                        <span className="text-muted">
                            Mostrando {(Array.isArray(payments) ? payments.length : 0)} de {pagination.total} registros
                        </span>
                        <div className="d-flex gap-1 align-items-center">
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                disabled={pagination.page === 1}
                                onClick={() => handlePageChange(pagination.page - 1)}
                                className="d-flex align-items-center"
                            >
                                Anterior
                            </Button>
                            {getPageNumbers().map((pageNum, index) => (
                                <React.Fragment key={index}>
                                    {pageNum === '...' ? (
                                        <span className="px-2 text-muted">...</span>
                                    ) : (
                                        <Button
                                            variant={
                                                pageNum === pagination.page
                                                    ? "primary"
                                                    : "outline-secondary"
                                            }
                                            size="sm"
                                            onClick={() => handlePageChange(pageNum as number)}
                                        >
                                            {pageNum}
                                        </Button>
                                    )}
                                </React.Fragment>
                            ))}
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                disabled={pagination.page === pagination.pages}
                                onClick={() => handlePageChange(pagination.page + 1)}
                                className="d-flex align-items-center"
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                </Card>
                <CashPaymentModal
                    show={modalOpen}
                    onHide={closeModal}
                    onSuccess={editingPayment ? handleEdit : handleAdd}
                    loading={loading}
                    payment={editingPayment ? {
                        importeAPagar: editingPayment.importeAPagar,
                        expenseConcept: editingPayment.expenseConcept?._id || "",
                        description: editingPayment.description || ""
                    } : undefined}
                    departmentId={departmentId}
                />
            </div>
        </div>
    );
};

export default CashPaymentsPage; 