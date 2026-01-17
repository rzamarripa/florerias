'use client'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    LuBell,
    LuCircleCheck,
    LuShoppingCart,
    LuX,
    LuShield
} from "react-icons/lu";
import { TbXboxXFilled } from "react-icons/tb";
import { Loader2 } from "lucide-react";
import { IconType } from "react-icons";
import { useState, useEffect } from "react";
import { orderNotificationsService, OrderNotification } from "@/services/orderNotifications";
import { discountAuthService } from "@/features/admin/modules/discount-auth/services/discountAuth";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

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

    const canViewNotifications = isManager || isCashier;

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
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [canViewNotifications]);

    const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        try {
            await orderNotificationsService.deleteNotification(notificationId);
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
            if (!notification.isRead) {
                await orderNotificationsService.markAsRead(notification._id);
                setOrderNotifications(prev =>
                    prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            router.push('/ventas/ordenes');
        } catch (error: any) {
            console.error('Error al marcar notificación:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await orderNotificationsService.markAllAsRead();
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
                setApprovedFolio(response.data.authFolio || '');
                try {
                    await orderNotificationsService.deleteNotification(selectedDiscountAuth._id);
                } catch (err) {
                    console.error('Error al eliminar notificación:', err);
                }
                setShowAuthDialog(false);
                setSelectedDiscountAuth(null);
                setDiscountAuthDetails(null);
                setShowSuccessModal(true);
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
                try {
                    await orderNotificationsService.deleteNotification(selectedDiscountAuth._id);
                } catch (err) {
                    console.error('Error al eliminar notificación:', err);
                }
                setShowAuthDialog(false);
                setSelectedDiscountAuth(null);
                setDiscountAuthDetails(null);
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

    if (!canViewNotifications) {
        return null;
    }

    return (
        <div className="topbar-item">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="topbar-link relative outline-none">
                        <LuBell className="text-xl" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-96 p-0">
                    <div className="px-3 py-2 border-b flex items-center justify-between">
                        <h6 className="font-semibold text-sm">Notificaciones de Órdenes</h6>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs text-primary hover:underline"
                            >
                                Marcar todas como leídas
                            </button>
                        )}
                    </div>

                    <ScrollArea className="max-h-[400px]">
                        {loading ? (
                            <div className="text-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                <p className="text-muted-foreground text-sm mt-2">Cargando notificaciones...</p>
                            </div>
                        ) : orderNotifications.length === 0 ? (
                            <div className="text-center py-8">
                                <LuBell className="text-3xl text-muted-foreground mx-auto mb-2" />
                                <p className="text-muted-foreground text-sm">No hay notificaciones</p>
                            </div>
                        ) : (
                            orderNotifications.map((notification) => {
                                const isDiscountRequest = notification.isDiscountAuth;
                                const isCanceled = notification.isCanceled;

                                let iconBgColor, Icon, notificationTitle;

                                if (isDiscountRequest) {
                                    iconBgColor = 'bg-yellow-100 text-yellow-600';
                                    Icon = LuShield;
                                    notificationTitle = notification.orderNumber;
                                } else if (isCanceled) {
                                    iconBgColor = 'bg-red-100 text-red-600';
                                    Icon = LuX;
                                    notificationTitle = `Orden cancelada: ${notification.orderNumber}`;
                                } else {
                                    iconBgColor = 'bg-green-100 text-green-600';
                                    Icon = LuShoppingCart;
                                    notificationTitle = `Nueva orden creada: ${notification.orderNumber}`;
                                }

                                return (
                                    <div
                                        key={notification._id}
                                        className={`p-3 border-b cursor-pointer hover:bg-muted/50 ${!notification.isRead ? 'bg-muted/30' : ''}`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBgColor}`}>
                                                <Icon className="text-lg" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{notificationTitle}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Por {notification.username} ({notification.userRole}) - {notification.branchId.branchName}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatTimeAgo(notification.createdAt)}
                                                </p>
                                                {isDiscountRequest && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="mt-2 text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                                                        onClick={(e) => handleOpenAuthDialog(notification, e)}
                                                    >
                                                        <LuShield size={14} className="mr-1" />
                                                        Autorizar
                                                    </Button>
                                                )}
                                            </div>
                                            <button
                                                className="text-muted-foreground hover:text-foreground flex-shrink-0"
                                                onClick={(e) => handleDeleteNotification(notification._id, e)}
                                            >
                                                <TbXboxXFilled className="text-xl" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </ScrollArea>

                    {orderNotifications.length > 0 && (
                        <div className="p-2 border-t">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    router.push('/ventas/ordenes');
                                }}
                                className="w-full text-center text-sm text-primary hover:underline py-1"
                            >
                                Ver todas las órdenes
                            </button>
                        </div>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Modal de Autorización de Descuento */}
            <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
                <DialogContent>
                    <DialogHeader className="bg-yellow-500 text-white -m-6 mb-0 p-4 rounded-t-lg">
                        <DialogTitle className="flex items-center gap-2">
                            <LuShield size={24} />
                            Autorizar Descuento
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        {loadingDetails ? (
                            <div className="text-center py-4">
                                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                <p className="text-muted-foreground mt-2">Cargando detalles...</p>
                            </div>
                        ) : selectedDiscountAuth && discountAuthDetails ? (
                            <>
                                <div className="mb-4 p-3 bg-muted rounded-lg">
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

                                <div className="mb-4 p-3 border rounded-lg">
                                    <h6 className="font-bold mb-3">Detalles del Descuento</h6>
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
                                        <span className="text-red-600">
                                            -${discountAuthDetails.discountAmount?.toFixed(2) || '0.00'}
                                        </span>
                                    </div>
                                    <div className="mb-2">
                                        <strong>Total Final:</strong>{' '}
                                        <span className="text-green-600 font-bold">
                                            ${discountAuthDetails.orderTotal?.toFixed(2) || '0.00'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <strong>Mensaje:</strong>
                                    <div className="p-2 bg-muted rounded mt-1">
                                        {discountAuthDetails.message}
                                    </div>
                                </div>

                                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                                    <strong>⚠️ Atención:</strong> Estás a punto de autorizar o rechazar esta solicitud de descuento.
                                </div>
                            </>
                        ) : (
                            <p className="text-muted-foreground">No se pudieron cargar los detalles de la solicitud.</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
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
                            variant="destructive"
                            onClick={handleRejectDiscount}
                            disabled={!!processingAuth || loadingDetails || !discountAuthDetails}
                        >
                            <LuX size={16} className="mr-2" />
                            {processingAuth === 'reject' ? 'Rechazando...' : 'Rechazar'}
                        </Button>
                        <Button
                            onClick={handleApproveDiscount}
                            disabled={!!processingAuth || loadingDetails || !discountAuthDetails}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <LuCircleCheck size={16} className="mr-2" />
                            {processingAuth === 'approve' ? 'Autorizando...' : 'Autorizar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Éxito */}
            <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader className="bg-green-600 text-white -m-6 mb-0 p-4 rounded-t-lg">
                        <DialogTitle className="flex items-center gap-2">
                            <LuCircleCheck size={24} />
                            Solicitud Autorizada
                        </DialogTitle>
                    </DialogHeader>
                    <div className="text-center py-6">
                        <LuCircleCheck size={64} className="text-green-600 mx-auto mb-4" />
                        <h5 className="text-lg font-semibold mb-4">¡Descuento Aprobado!</h5>
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-muted-foreground text-sm mb-2">El folio de autorización es:</p>
                            <h3 className="text-green-600 text-2xl font-bold">{approvedFolio}</h3>
                        </div>
                    </div>
                    <DialogFooter className="justify-center">
                        <Button
                            onClick={() => setShowSuccessModal(false)}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default NotificationDropdown;
