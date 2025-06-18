import React, { useState } from "react";
import { BsCheck2 } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import { Spinner } from "react-bootstrap";
import StateModal from "./StateModal";
import { StateActionsProps } from "../types";



const stateService = {
    toggleStatus: async (id: string, currentStatus: boolean) => {
        console.log(id, currentStatus);
    }
};

const StateActions: React.FC<StateActionsProps> = ({
    state,
    onStateSaved,
}) => {
    const [isToggling, setIsToggling] = useState<boolean>(false);

    const handleToggleState = async (id: string, currentStatus: boolean) => {
        try {
            
        } catch (error: any) {
            console.error("Error toggling state:", error);

            let errorMessage = `Error al ${currentStatus ? 'desactivar' : 'activar'} el estado "${state.name}"`;

            if (error.response?.status === 400) {
                errorMessage = error.response.data?.message || errorMessage;
            } else if (error.response?.status === 404) {
                errorMessage = "Estado no encontrado";
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
            return state.isActive ? "Desactivando..." : "Activando...";
        }
        return state.isActive ? "Desactivar estado" : "Activar estado";
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
            <StateModal
                mode="edit"
                editingState={state}
                onStateSaved={onStateSaved}
            />

            <button
                className={getToggleButtonClass()}
                title={getToggleButtonTitle()}
                onClick={() => handleToggleState(state._id, state.isActive)}
                disabled={isToggling}
            >
                {isToggling ? (
                    <Spinner
                        animation="border"
                        size="sm"
                        style={{ width: "16px", height: "16px" }}
                    />
                ) : state.isActive ? (
                    <FiTrash2 size={16} />
                ) : (
                    <BsCheck2 size={16} />
                )}
            </button>
        </div>
    );
};

export default StateActions;