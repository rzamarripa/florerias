import React from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Button, Spinner } from 'react-bootstrap';
import { FaRegEye } from 'react-icons/fa';

interface PackpageActionsProps {
  packpageId: string;
  packageStatus?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  loadingDelete?: boolean;
}

const PackpageActions: React.FC<PackpageActionsProps> = ({
  packpageId,
  packageStatus,
  onEdit,
  onDelete,
  loadingDelete
}) => {
  const router = useRouter();

  return (
    <div className="d-flex justify-content-center gap-1">
      <Button
        variant="light"
        size="sm"
        className="btn-icon rounded-circle"
        title="Ver detalle"
        onClick={() => router.push(`/modulos/paquetes-facturas/detalle-paquete?packpageId=${packpageId}`)}
      >
        <FaRegEye size={16} />
      </Button>



      <Button
        variant="light"
        size="sm"
        className="btn-icon rounded-circle"
        title="Editar"
        onClick={onEdit}
      >
        <FiEdit2 size={16} />
      </Button>
      <Button
        variant="light"
        size="sm"
        className="btn-icon rounded-circle"
        title="Eliminar"
        onClick={onDelete}
        disabled={loadingDelete}
      >
        {loadingDelete ? <Spinner animation="border" size="sm" style={{ width: 16, height: 16 }} /> : <FiTrash2 size={16} />}
      </Button>
    </div>
  );
};

export default PackpageActions; 