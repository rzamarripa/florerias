import React, { useState } from "react";
import { BsCheck2 } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import { Spinner } from "react-bootstrap";
import MunicipalityModal from "./MunicipalityModal";
import { Municipality } from "../types";

interface MunicipalityActionsProps {
    municipality: Municipality;
    onMunicipalitySaved?: () => void;
    onToggleStatus: (id: string, isActive: boolean) => void;
}


const MunicipalityActions: React.FC<MunicipalityActionsProps> = ({
    municipality,
    onMunicipalitySaved,
    onToggleStatus,
}) => {
    const [isToggling, setIsToggling] = useState<boolean>(false);

    const handleToggle = async () => {
        setIsToggling(true);
        await onToggleStatus(municipality._id, municipality.isActive);
        setIsToggling(false);
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
                onClick={handleToggle}
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