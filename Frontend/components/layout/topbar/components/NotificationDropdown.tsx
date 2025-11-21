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
    LuX
} from "react-icons/lu";
import {TbXboxXFilled} from "react-icons/tb";

import SimpleBar from "simplebar-react";
import {IconType} from "react-icons";
import { useState, useEffect } from "react";
import { orderNotificationsService, OrderNotification } from "@/services/orderNotifications";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

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

    // Mostrar notificaciones si es Manager o Cajero
    const canViewNotifications = isManager || isCashier;

    // Cargar notificaciones solo si es Manager o Cajero
    const fetchNotifications = async () => {
        if (!canViewNotifications) return;

        setLoading(true);
        try {
            const response = await orderNotificationsService.getNotifications();
            setOrderNotifications(response.data);
            setUnreadCount(response.unreadCount);
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
                                const isCanceled = notification.isCanceled;
                                const iconBgColor = isCanceled ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success';
                                const Icon = isCanceled ? LuX : LuShoppingCart;
                                const iconFillClass = isCanceled ? 'fill-danger' : 'fill-success';
                                const notificationTitle = isCanceled
                                    ? `Orden cancelada: ${notification.orderNumber}`
                                    : `Nueva orden creada: ${notification.orderNumber}`;

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
        </div>
    )
}

export default NotificationDropdown