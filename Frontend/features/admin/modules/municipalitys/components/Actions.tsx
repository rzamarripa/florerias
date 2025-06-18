import React, { useState } from "react";
import { BsCheck2 } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import { Spinner } from "react-bootstrap";
import MunicipalityModal from "./MunicipalityModal";

interface Municipality {
    _id: string;
    name: string;
    state: string;
    country: string;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
}

interface MunicipalityActionsProps {
    municipality: Municipality;
    onMunicipalitySaved?: () => void;
}

// Mock service - replace with actual service
const municipalityService = {
    toggleStatus: async (id: string, currentStatus: boolean) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true, message: "Estado actualizado correctamente" };
    }
};

const MunicipalityActions: React.FC<MunicipalityActionsProps> = ({
    municipality,
    onMunicipalitySaved,
}) => {
    const [isToggling, setIsToggling] = useState<boolean>(false);

    const handleToggleMunicipality = async (id: string, currentStatus: boolean) => {
        try {
            setIsToggling(true);

            const response = await municipalityService.toggleStatus(id, currentStatus);

            if (response.success) {
                const action = currentStatus ? 'desactivado' : 'activado';
                toast.success(`Municipio "${municipality.name}" ${action} correctamente`);
                onMunicipalitySaved?.();
            } else {
                const errorMessage = response.message || `Error al ${currentStatus ? 'desactivar' : 'activar'} el municipio`;
                toast.error(errorMessage);
            }
        } catch (error: any) {
            console.error("Error toggling municipality:", error);

            let errorMessage = `Error al ${currentStatus ? 'desactivar' : 'activar'} el municipio "${municipality.name}"`;

            if (error.response?.status === 400) {
                errorMessage = error.response.data?.message || errorMessage;
            } else if (error.response?.status === 404) {
                errorMessage = "Municipio no encontrado";
            } else if (error.response?.status >= 500) {
                errorMessage = "Error interno del servidor. Intenta nuevamente.";
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
        } finally {
            setIsToggling(false);
        }
    };

    const getToggleButtonTitle = () => {
        if (isToggling) {
            return municipality.isActive ? "Desactivando..." : "Activando...";
        }
        return municipality.isActive ? "Desactivar municipio" : "Activar municipio";
    };

    const getToggleButtonClass = () => {
        let baseClass = "btn btn-light btn-icon btn-sm rounded-circle";
        if (isToggling) {
            baseClass += " disabled";
        }
        return baseClass;
    };

    return (
        <div className="d-flex justify-content-center gap-1">
            <MunicipalityModal
                mode="edit"
                editingMunicipality={municipality}
                onMunicipalitySaved={onMunicipalitySaved}
            />

            <button
                className={getToggleButtonClass()}
                title={getToggleButtonTitle()}
                onClick={() => handleToggleMunicipality(municipality._id, municipality.isActive)}
                disabled={isToggling}
            >
                {isToggling ? (
                    <Spinner
                        animation="border"
                        size="sm"
                        style={{ width: "16px", height: "16px" }}
                    />
                ) : municipality.isActive ? (
                    <FiTrash2 size={16} />
                ) : (
                    <BsCheck2 size={16} />
                )}
            </button>
        </div>
    );
};

export default MunicipalityActions;