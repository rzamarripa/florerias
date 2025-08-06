import React from "react";
import { useRouter } from "next/navigation";
import { Button, Spinner } from "react-bootstrap";
import { FaRegEye, FaCheck, FaTimes, FaCopy } from "react-icons/fa";
import { toast } from "react-toastify";

interface AuthorizationFolioActionsProps {
  folioNumber: string;
  packageId: string;
  onAuthorize?: () => void;
  onReject?: () => void;
  loadingAuthorize?: boolean;
  loadingReject?: boolean;
  isTreasuryUser?: boolean;
}

const AuthorizationFolioActions: React.FC<AuthorizationFolioActionsProps> = ({
  folioNumber,
  packageId,
  onAuthorize,
  onReject,
  loadingAuthorize,
  loadingReject,
  isTreasuryUser = false,
}) => {
  const router = useRouter();

  const handleCopyFolio = async () => {
    try {
      await navigator.clipboard.writeText(folioNumber);
      toast.success("Folio copiado al portapapeles");
    } catch (error) {
      console.error("Error al copiar folio:", error);
      toast.error("Error al copiar folio");
    }
  };

  return (
    <div className="d-flex justify-content-center gap-1">
      <Button
        variant="light"
        size="sm"
        className="btn-icon rounded-circle"
        title="Ver paquete"
        onClick={() =>
          router.push(
            `/modulos/paquetes-facturas/detalle-paquete?packpageId=${packageId}`
          )
        }
      >
        <FaRegEye size={16} />
      </Button>

      <Button
        variant="light"
        size="sm"
        className="btn-icon rounded-circle"
        title="Copiar folio"
        onClick={handleCopyFolio}
      >
        <FaCopy size={16} />
      </Button>

      <Button
        variant="success"
        size="sm"
        className="btn-icon rounded-circle"
        title="Autorizar"
        onClick={onAuthorize}
        disabled={loadingAuthorize || loadingReject || !isTreasuryUser}
      >
        {loadingAuthorize ? (
          <Spinner
            animation="border"
            size="sm"
            style={{ width: 16, height: 16 }}
          />
        ) : (
          <FaCheck size={16} />
        )}
      </Button>

      <Button
        variant="danger"
        size="sm"
        className="btn-icon rounded-circle"
        title="Rechazar"
        onClick={onReject}
        disabled={loadingAuthorize || loadingReject || !isTreasuryUser}
      >
        {loadingReject ? (
          <Spinner
            animation="border"
            size="sm"
            style={{ width: 16, height: 16 }}
          />
        ) : (
          <FaTimes size={16} />
        )}
      </Button>
    </div>
  );
};

export default AuthorizationFolioActions;
