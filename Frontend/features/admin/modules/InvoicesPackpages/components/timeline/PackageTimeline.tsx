import React, { useState, useEffect } from "react";
import { Container, Spinner, Alert } from "react-bootstrap";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Truck,
  Package,
  Eraser,
  Send,
  NotebookText,
  HandCoins,
  BookCheck,
  Banknote,
} from "lucide-react";
import {
  timelineService,
  TimelineItem as ApiTimelineItem,
} from "../../services/timelineService";

interface TimelineItem {
  userName: string;
  userImage: string;
  dateMovement: string;
  packageStatus: string;
  icon: string;
  iconColor: string;
  title: string;
  description: string;
}

interface PackageTimelineProps {
  packageId?: string;
  refreshTrigger?: number;
}

const PackageTimeline: React.FC<PackageTimelineProps> = ({
  packageId,
  refreshTrigger,
}) => {
  const [timelineData, setTimelineData] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para transformar datos de la API al formato del componente
  const transformApiData = (apiData: ApiTimelineItem[]): TimelineItem[] => {
    return apiData.map((item) => {
      const statusConfig = getStatusConfig(item.status);
      const date = new Date(item.createdAt);

      // Manejo seguro de la imagen del usuario
      let userImage =
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cccccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
      if (item.userId?.profile?.image) {
        userImage = item.userId.profile.image;
      }

      const transformedItem = {
        userName:
          item.userId?.profile?.fullName ||
          item.userId?.username ||
          "Usuario desconocido",
        userImage: userImage,
        dateMovement: date.toLocaleString("es-MX", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        packageStatus: item.status,
        icon: item.status,
        iconColor: statusConfig.color,
        title: statusConfig.title,
        description: statusConfig.description,
      };

      return transformedItem;
    });
  };

  // Configuración de cada estatus
  const getStatusConfig = (status: string) => {
    const configs = {
      borrador: {
        title: "Paquete Creado",
        description: "Paquete de facturas creado en estado borrador",
        color: "secondary",
      },
      enviado: {
        title: "Paquete Enviado",
        description: "Paquete enviado a tesorería para revisión",
        color: "primary",
      },
      programado: {
        title: "Pago Programado",
        description: "Pago programado en el sistema bancario",
        color: "info",
      },
      fondeado: {
        title: "Paquete Fondeado",
        description: "Fondos disponibles para el pago del paquete",
        color: "warning",
      },
      generado: {
        title: "Reporte Generado",
        description: "Reporte de pago generado exitosamente",
        color: "success",
      },
      Generado: {
        title: "Reporte Generado",
        description: "Reporte de pago generado exitosamente",
        color: "success",
      },
      PorFondear: {
        title: "Por Fondear",
        description: "Reporte generado, paquete listo para fondear",
        color: "dark",
      },
      Fondeado: {
        title: "Paquete Fondeado",
        description: "Fondos transferidos, paquete listo para pago",
        color: "success",
      },
      pagado: {
        title: "Pago Completado",
        description: "Pago ejecutado y completado exitosamente",
        color: "success",
      },
    };

    return (
      configs[status as keyof typeof configs] || {
        title: "Estado Desconocido",
        description: "Estado no reconocido",
        color: "secondary",
      }
    );
  };

  // Cargar datos del timeline desde la API
  useEffect(() => {
    const loadTimelineData = async () => {
      if (!packageId) {
        setError("ID del paquete no proporcionado");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const apiData = await timelineService.getPackageTimeline(packageId);
        const transformedData = transformApiData(apiData);

        setTimelineData(transformedData);
      } catch (error) {
        console.error("Error al cargar timeline:", error);
        setError("Error al cargar el timeline del paquete");
      } finally {
        setLoading(false);
      }
    };

    loadTimelineData();
  }, [packageId, refreshTrigger]);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "CheckCircle":
        return <CheckCircle size={16} />;
      case "Clock":
        return <Clock size={16} />;
      case "AlertCircle":
        return <AlertCircle size={16} />;
      case "Truck":
        return <Truck size={16} />;
      case "Package":
        return <Package size={16} />;
      case "borrador":
        return <Eraser size={16} />;
      case "enviado":
        return <Send size={16} />;
      case "programado":
        return <NotebookText size={16} />;
      case "fondeado":
        return <HandCoins size={16} />;
      case "generado":
        return <BookCheck size={16} />;
      case "Generado":
        return <BookCheck size={16} />;
      case "PorFondear":
        return <BookCheck size={16} />;
      case "Fondeado":
        return <HandCoins size={16} />;
      case "pagado":
        return <Banknote size={16} />;
      default:
        return <CheckCircle size={16} />;
    }
  };

  // Mostrar estado de carga
  if (loading) {
    return (
      <Container fluid className="p-0">
        <div className="text-center py-4">
          <Spinner animation="border" />
          <div className="mt-2 text-muted">Cargando timeline...</div>
        </div>
      </Container>
    );
  }

  // Mostrar error si existe
  if (error) {
    return (
      <Container fluid className="p-0">
        <Alert variant="danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      </Container>
    );
  }

  // Mostrar mensaje si no hay datos
  if (timelineData.length === 0) {
    return (
      <Container fluid className="p-0">
        <Alert variant="info">
          <i className="bi bi-info-circle me-2"></i>
          No hay registros en el timeline para este paquete.
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="p-0">
      <div className="timeline-container position-relative align-items-center">
        {/* Línea vertical punteada continua central */}
        <div
          className="position-absolute"
          style={{
            left: "110px",
            top: "20px",
            bottom: "20px",
            width: "2px",
            background:
              "repeating-linear-gradient(to bottom, #e9ecef 0px, #e9ecef 4px, transparent 4px, transparent 8px)",
            zIndex: 1,
          }}
        />

        {timelineData.map((item, index) => (
          <div key={index} className="timeline-item position-relative mb-4">
            <div className="d-flex align-items-start">
              {/* Fecha a la izquierda */}
              <div className="me-4" style={{ width: "80px", flexShrink: 0 }}>
                <div className="text-muted small">{item.dateMovement}</div>
              </div>

              {/* Icono centrado sobre la línea */}
              <div
                className="position-relative me-4"
                style={{ flexShrink: 0, width: "40px" }}
              >
                <div
                  className={`bg-${item.iconColor} text-white rounded-circle d-flex align-items-center justify-content-center position-relative`}
                  style={{
                    width: "40px",
                    height: "40px",
                    zIndex: 2,
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    left: "-20px",
                  }}
                >
                  {getIcon(item.icon)}
                </div>
              </div>

              {/* Detalles del evento */}
              <div className="flex-grow-1">
                <h6
                  className="mb-1 fw-semibold text-dark"
                  style={{ fontSize: "0.95rem" }}
                >
                  {item.title}
                </h6>
                <p
                  className="mb-2 text-muted small"
                  style={{ fontSize: "0.85rem", lineHeight: "1.4" }}
                >
                  {item.description}
                </p>
                <div className="d-flex align-items-center">
                  <img
                    src={item.userImage}
                    alt={item.userName}
                    className="rounded-circle me-2"
                    style={{
                      width: "20px",
                      height: "20px",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cccccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
                    }}
                  />
                  <span
                    className="text-success small fw-medium"
                    style={{ fontSize: "0.8rem" }}
                  >
                    Por {item.userName}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
};

export default PackageTimeline;
