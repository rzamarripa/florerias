'use client'
import {Button, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row, Spinner} from "react-bootstrap";
import {
    LuBatteryWarning,
    LuBell, LuBellRing,
    LuBug, LuCalendar, LuCircleCheck,
    LuCloudUpload, LuDatabaseZap, LuDownload, LuLock,
    LuMessageCircle,
    LuServerCrash, LuSquareCheck, LuTriangleAlert,
    LuUserPlus,
    LuShoppingCart,
    LuX,
    LuShield
} from "react-icons/lu";
import {TbXboxXFilled} from "react-icons/tb";

import SimpleBar from "simplebar-react";
import {IconType} from "react-icons";
import { useState, useEffect } from "react";
import { orderNotificationsService, OrderNotification } from "@/services/orderNotifications";
import { discountAuthService } from "@/features/admin/modules/discount-auth/services/discountAuth";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Modal } from "react-bootstrap";

type NotificationType = {
    id: string;
    icon: IconType;
    variant: 'danger' | 'warning' | 'success' | 'primary' | 'info' | 'secondary';
    message: string;
    timestamp: string;
}

const notifications: NotificationType[] = [
    {
        id: 'notification-1',
        icon: LuServerCrash,
        variant: 'danger',
        message: 'Critical alert: Server crash detected',
        timestamp: '30 minutes ago'
    },
    {
        id: 'notification-2',
        icon: LuTriangleAlert,
        variant: 'warning',
        message: 'High memory usage on Node A',
        timestamp: '10 minutes ago'
    },
    {
        id: 'notification-3',
        icon: LuCircleCheck,
        variant: 'success',
        message: 'Backup completed successfully',
        timestamp: '1 hour ago'
    },
    {
        id: 'notification-4',
        icon: LuUserPlus,
        variant: 'primary',
        message: 'New user registration: Sarah Miles',
        timestamp: 'Just now'
    },
    {
        id: 'notification-5',
        icon: LuBug,
        variant: 'danger',
        message: 'Bug reported in payment module',
        timestamp: '20 minutes ago'
    },
    {
        id: 'notification-6',
        icon: LuMessageCircle,
        variant: 'info',
        message: 'New comment on Task #142',
        timestamp: '15 minutes ago'
    },
    {
        id: 'notification-7',
        icon: LuBatteryWarning,
        variant: 'warning',
        message: 'Low battery on Device X',
        timestamp: '45 minutes ago'
    },
    {
        id: 'notification-8',
        icon: LuCloudUpload,
        variant: 'success',
        message: 'File upload completed',
        timestamp: '1 hour ago'
    },
    {
        id: 'notification-9',
        icon: LuCalendar,
        variant: 'primary',
        message: 'Team meeting scheduled at 3 PM',
        timestamp: '2 hours ago'
    },
    {
        id: 'notification-10',
        icon: LuDownload,
        variant: 'secondary',
        message: 'Report ready for download',
        timestamp: '3 hours ago'
    },
    {
        id: 'notification-11',
        icon: LuLock,
        variant: 'danger',
        message: 'Multiple failed login attempts',
        timestamp: '5 hours ago'
    },
    {
        id: 'notification-12',
        icon: LuBellRing,
        variant: 'info',
        message: 'Reminder: Submit your timesheet',
        timestamp: 'Today, 9:00 AM'
    },
    {
        id: 'notification-13',
        icon: LuDatabaseZap,
        variant: 'warning',
        message: 'Database nearing capacity',
        timestamp: 'Yesterday'
    },
    {
        id: 'notification-14',
        icon: LuSquareCheck,
        variant: 'success',
        message: 'System check completed',
        timestamp: '2 days ago'
    }
];

const NotificationDropdown = () => {
    const router = useRouter();
    const { getIsManager, getIsCashier } = useUserRoleStore();
    const isManager = getIsManager();
    const isCashier = getIsCashier();
    const [orderNotifications, setOrderNotifications] = useState<OrderNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [showAuthDialog, setShowAuthDialog] = useState(false);
    const [selectedDiscountAuth, setSelectedDiscountAuth] = useState<OrderNotification | null>(null);
    const [discountAuthDetails, setDiscountAuthDetails] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [processingAuth, setProcessingAuth] = useState<'approve' | 'reject' | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [approvedFolio, setApprovedFolio] = useState<string>('');

    // Mostrar notificaciones si es Manager o Cajero
    const canViewNotifications = isManager || isCashier;

    // Cargar notificaciones solo si es Manager o Cajero
    const fetchNotifications = async () => {
        if (!canViewNotifications) return;

        setLoading(true);
        try {
            const response = await orderNotificationsService.getNotifications();
            if (response.success) {
                setOrderNotifications(response.data);
                setUnreadCount(response.unreadCount);
            }
        } catch (error: any) {
            console.error('Error al cargar notificaciones:', error);
            // No mostrar toast de error para evitar spam
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Actualizar notificaciones cada 30 segundos
        const interval = setInterval(fetchNotifications, 30000);

        return () => clearInterval(interval);
    }, [canViewNotifications]);

    const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        try {
            await orderNotificationsService.deleteNotification(notificationId);
            // Actualizar lista de notificaciones
            setOrderNotifications(prev => prev.filter(n => n._id !== notificationId));
            setUnreadCount(prev => Math.max(0, prev - 1));
            toast.success('Notificación eliminada');
        } catch (error: any) {
            console.error('Error al eliminar notificación:', error);
            toast.error(error.message || 'Error al eliminar notificación');
        }
    };

    const handleNotificationClick = async (notification: OrderNotification) => {
        try {
            // Marcar como leída si no lo está
            if (!notification.isRead) {
                await orderNotificationsService.markAsRead(notification._id);
                // Actualizar estado local
                setOrderNotifications(prev =>
                    prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }

            // Redirigir a la página de órdenes
            router.push('/ventas/ordenes');
        } catch (error: any) {
            console.error('Error al marcar notificación:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await orderNotificationsService.markAllAsRead();
            // Actualizar estado local
            setOrderNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            toast.success('Todas las notificaciones marcadas como leídas');
        } catch (error: any) {
            console.error('Error al marcar todas las notificaciones:', error);
            toast.error(error.message || 'Error al marcar notificaciones');
        }
    };

    const handleOpenAuthDialog = async (notification: OrderNotification, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedDiscountAuth(notification);
        setShowAuthDialog(true);

        // Cargar detalles completos de la solicitud
        if (notification.discountAuthId) {
            setLoadingDetails(true);
            try {
                const response = await discountAuthService.getDiscountAuthById(notification.discountAuthId);
                if (response.success) {
                    setDiscountAuthDetails(response.data);
                }
            } catch (error: any) {
                console.error('Error al cargar detalles:', error);
                toast.error('Error al cargar detalles de la solicitud');
            } finally {
                setLoadingDetails(false);
            }
        }
    };

    const handleApproveDiscount = async () => {
        if (!selectedDiscountAuth || !selectedDiscountAuth.discountAuthId) return;

        setProcessingAuth('approve');
        try {
            const response = await discountAuthService.approveRejectDiscountAuth(
                selectedDiscountAuth.discountAuthId,
                { isApproved: true }
            );

            if (response.success) {
                // Guardar el folio para mostrarlo en el modal
                setApprovedFolio(response.data.authFolio || '');

                // Eliminar la notificación
                try {
                    await orderNotificationsService.deleteNotification(selectedDiscountAuth._id);
                } catch (err) {
                    console.error('Error al eliminar notificación:', err);
                }

                // Cerrar el modal de autorización y mostrar el modal de éxito
                setShowAuthDialog(false);
                setSelectedDiscountAuth(null);
                setDiscountAuthDetails(null);
                setShowSuccessModal(true);

                // Actualizar notificaciones
                await fetchNotifications();
            }
        } catch (error: any) {
            console.error('Error al aprobar descuento:', error);
            toast.error(error.message || 'Error al aprobar el descuento');
        } finally {
            setProcessingAuth(null);
        }
    };

    const handleRejectDiscount = async () => {
        if (!selectedDiscountAuth || !selectedDiscountAuth.discountAuthId) return;

        setProcessingAuth('reject');
        try {
            const response = await discountAuthService.approveRejectDiscountAuth(
                selectedDiscountAuth.discountAuthId,
                { isApproved: false }
            );

            if (response.success) {
                toast.info('Descuento rechazado');

                // Eliminar la notificación
                try {
                    await orderNotificationsService.deleteNotification(selectedDiscountAuth._id);
                } catch (err) {
                    console.error('Error al eliminar notificación:', err);
                }

                setShowAuthDialog(false);
                setSelectedDiscountAuth(null);
                setDiscountAuthDetails(null);
                // Actualizar notificaciones
                await fetchNotifications();
            }
        } catch (error: any) {
            console.error('Error al rechazar descuento:', error);
            toast.error(error.message || 'Error al rechazar el descuento');
        } finally {
            setProcessingAuth(null);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInMinutes = Math.floor(diffInMs / 60000);
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInMinutes < 1) return 'Justo ahora';
        if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
        if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
        if (diffInDays < 7) return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;

        return date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
    };

    // Solo mostrar notificaciones para Manager y Cajero
    if (!canViewNotifications) {
        return null;
    }

    return (
        <div className="topbar-item">
            <Dropdown align="end">
                <DropdownToggle as={'button'} className="topbar-link dropdown-toggle drop-arrow-none">
                    <LuBell className="fs-xxl"/>
                    {unreadCount > 0 && (
                        <span className="badge badge-square text-bg-warning topbar-badge">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </DropdownToggle>

                <DropdownMenu className="p-0 dropdown-menu-end dropdown-menu-lg">
                    <div className="px-3 py-2 border-bottom">
                        <Row className="align-items-center">
                            <Col>
                                <h6 className="m-0 fs-md fw-semibold">Notificaciones de Órdenes</h6>
                            </Col>
                            <Col className="text-end">
                                {unreadCount > 0 && (
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="badge text-bg-light badge-label py-1 text-decoration-none"
                                        onClick={handleMarkAllAsRead}
                                    >
                                        Marcar todas como leídas
                                    </Button>
                                )}
                            </Col>
                        </Row>
                    </div>

                    <SimpleBar style={{maxHeight: '400px'}}>
                        {loading ? (
                            <div className="text-center py-4">
                                <Spinner animation="border" size="sm" />
                                <p className="text-muted mt-2 mb-0">Cargando notificaciones...</p>
                            </div>
                        ) : orderNotifications.length === 0 ? (
                            <div className="text-center py-4">
                                <LuBell className="fs-xxl text-muted mb-2" />
                                <p className="text-muted mb-0">No hay notificaciones</p>
                            </div>
                        ) : (
                            orderNotifications.map((notification) => {
                                // Determinar el tipo de notificación
                                const isDiscountRequest = notification.isDiscountAuth;
                                const isCanceled = notification.isCanceled;

                                let iconBgColor, Icon, iconFillClass, notificationTitle;

                                if (isDiscountRequest) {
                                    iconBgColor = 'bg-warning-subtle text-warning';
                                    Icon = LuShield;
                                    iconFillClass = 'fill-warning';
                                    notificationTitle = notification.orderNumber;
                                } else if (isCanceled) {
                                    iconBgColor = 'bg-danger-subtle text-danger';
                                    Icon = LuX;
                                    iconFillClass = 'fill-danger';
                                    notificationTitle = `Orden cancelada: ${notification.orderNumber}`;
                                } else {
                                    iconBgColor = 'bg-success-subtle text-success';
                                    Icon = LuShoppingCart;
                                    iconFillClass = 'fill-success';
                                    notificationTitle = `Nueva orden creada: ${notification.orderNumber}`;
                                }

                                return (
                                    <DropdownItem
                                        className={`notification-item py-2 text-wrap ${!notification.isRead ? 'bg-light' : ''}`}
                                        key={notification._id}
                                        onClick={() => handleNotificationClick(notification)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <span className="d-flex gap-2">
                                            <span className="avatar-md flex-shrink-0">
                                                <span className={`avatar-title ${iconBgColor} rounded fs-22`}>
                                                    <Icon className={`fs-xl ${iconFillClass}`}/>
                                                </span>
                                            </span>
                                            <span className="flex-grow-1 text-muted">
                                                <span className="fw-medium text-body">
                                                    {notificationTitle}
                                                </span>
                                                <br/>
                                                <span className="fs-xs">
                                                    Por {notification.username} ({notification.userRole}) - {notification.branchId.branchName}
                                                </span>
                                                <br/>
                                                <span className="fs-xs text-muted">
                                                    {formatTimeAgo(notification.createdAt)}
                                                </span>
                                                {isDiscountRequest && (
                                                    <div className="mt-2">
                                                        <Button
                                                            variant="warning"
                                                            size="sm"
                                                            className="me-2"
                                                            onClick={(e) => handleOpenAuthDialog(notification, e)}
                                                        >
                                                            <LuShield size={14} className="me-1" />
                                                            Autorizar
                                                        </Button>
                                                    </div>
                                                )}
                                            </span>
                                            <Button
                                                variant="link"
                                                type="button"
                                                className="flex-shrink-0 text-muted p-0"
                                                onClick={(e) => handleDeleteNotification(notification._id, e)}
                                            >
                                                <TbXboxXFilled className="fs-xxl"/>
                                            </Button>
                                        </span>
                                    </DropdownItem>
                                );
                            })
                        )}
                    </SimpleBar>

                    {orderNotifications.length > 0 && (
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                router.push('/ventas/ordenes');
                            }}
                            className="dropdown-item text-center text-reset text-decoration-underline link-offset-2 fw-bold notify-item border-top border-light py-2"
                        >
                            Ver todas las órdenes
                        </a>
                    )}
                </DropdownMenu>
            </Dropdown>

            {/* Modal de Autorización de Descuento */}
            <Modal
                show={showAuthDialog}
                onHide={() => {
                    setShowAuthDialog(false);
                    setSelectedDiscountAuth(null);
                }}
                centered
            >
                <Modal.Header closeButton className="bg-warning text-white">
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <LuShield size={24} />
                        Autorizar Descuento
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loadingDetails ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" size="sm" />
                            <p className="text-muted mt-2">Cargando detalles...</p>
                        </div>
                    ) : selectedDiscountAuth && discountAuthDetails ? (
                        <>
                            <div className="mb-3 p-3 bg-light rounded">
                                <div className="mb-2">
                                    <strong>Solicitante:</strong> {selectedDiscountAuth.username} ({selectedDiscountAuth.userRole})
                                </div>
                                <div className="mb-2">
                                    <strong>Sucursal:</strong> {selectedDiscountAuth.branchId.branchName}
                                </div>
                                <div className="mb-2">
                                    <strong>Fecha:</strong> {formatTimeAgo(selectedDiscountAuth.createdAt)}
                                </div>
                            </div>

                            <div className="mb-3 p-3 border rounded">
                                <h6 className="fw-bold mb-3">Detalles del Descuento</h6>
                                <div className="mb-2">
                                    <strong>Subtotal de la Orden:</strong> ${((discountAuthDetails.orderTotal || 0) + (discountAuthDetails.discountAmount || 0)).toFixed(2)}
                                </div>
                                <div className="mb-2">
                                    <strong>Descuento Solicitado:</strong>{' '}
                                    {discountAuthDetails.discountType === 'porcentaje'
                                        ? `${discountAuthDetails.discountValue}%`
                                        : `$${discountAuthDetails.discountValue?.toFixed(2)}`}
                                </div>
                                <div className="mb-2">
                                    <strong>Monto del Descuento:</strong>{' '}
                                    <span className="text-danger">
                                        -${discountAuthDetails.discountAmount?.toFixed(2) || '0.00'}
                                    </span>
                                </div>
                                <div className="mb-2">
                                    <strong>Total Final:</strong>{' '}
                                    <span className="text-success fw-bold">
                                        ${discountAuthDetails.orderTotal?.toFixed(2) || '0.00'}
                                    </span>
                                </div>
                            </div>

                            <div className="mb-3">
                                <strong>Mensaje:</strong>
                                <div className="p-2 bg-light rounded mt-1">
                                    {discountAuthDetails.message}
                                </div>
                            </div>

                            <div className="alert alert-warning mb-0">
                                <strong>⚠️ Atención:</strong> Estás a punto de autorizar o rechazar esta solicitud de descuento.
                            </div>
                        </>
                    ) : (
                        <p className="text-muted">No se pudieron cargar los detalles de la solicitud.</p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setShowAuthDialog(false);
                            setSelectedDiscountAuth(null);
                            setDiscountAuthDetails(null);
                        }}
                        disabled={!!processingAuth || loadingDetails}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleRejectDiscount}
                        disabled={!!processingAuth || loadingDetails || !discountAuthDetails}
                        className="d-flex align-items-center gap-2"
                    >
                        <LuX size={16} />
                        {processingAuth === 'reject' ? 'Rechazando...' : 'Rechazar'}
                    </Button>
                    <Button
                        variant="success"
                        onClick={handleApproveDiscount}
                        disabled={!!processingAuth || loadingDetails || !discountAuthDetails}
                        className="d-flex align-items-center gap-2"
                    >
                        <LuCircleCheck size={16} />
                        {processingAuth === 'approve' ? 'Autorizando...' : 'Autorizar'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de Éxito - Solicitud Autorizada */}
            <Modal
                show={showSuccessModal}
                onHide={() => setShowSuccessModal(false)}
                centered
                size="sm"
            >
                <Modal.Header closeButton className="bg-success text-white border-0">
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <LuCircleCheck size={24} />
                        Solicitud Autorizada
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center py-4">
                    <div className="mb-3">
                        <LuCircleCheck size={64} className="text-success" />
                    </div>
                    <h5 className="mb-3">¡Descuento Aprobado!</h5>
                    <div className="p-3 bg-light rounded">
                        <p className="mb-2 text-muted">El folio de autorización es:</p>
                        <h3 className="text-success fw-bold mb-0">{approvedFolio}</h3>
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-0 justify-content-center">
                    <Button
                        variant="success"
                        onClick={() => setShowSuccessModal(false)}
                        className="px-4"
                    >
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}

export default NotificationDropdown