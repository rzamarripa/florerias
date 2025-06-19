import React, { useState } from "react";
import { Spinner } from "react-bootstrap";
import { BsCheck2 } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import { countriesService } from "../services/countries";
import CountryModal from "./CountryModal";

interface Country {
  _id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface CountryActionsProps {
  country: Country;
  onCountrySaved?: () => void;
}

const CountryActions: React.FC<CountryActionsProps> = ({
  country,
  onCountrySaved,
}) => {
  const [isToggling, setIsToggling] = useState<boolean>(false);

  const handleToggleCountry = async () => {
    setIsToggling(true);
    try {
      const response = await countriesService.toggleStatus(country._id, country.isActive);
      if (response.success) {
        const action = country.isActive ? 'desactivado' : 'activado';
        toast.success(`País "${country.name}" ${action} exitosamente`);
        if (onCountrySaved) onCountrySaved();
      } else {
        throw new Error(response.message || `Error al ${country.isActive ? 'desactivar' : 'activar'} el país`);
      }
    } catch (error: any) {
      console.error("Error toggling country:", error);

      let errorMessage = `Error al ${country.isActive ? 'desactivar' : 'activar'} el país "${country.name}"`;

      if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.response?.status === 404) {
        errorMessage = "País no encontrado";
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

  return (
    <div className="d-flex justify-content-center gap-1">
      <CountryModal
        mode="edit"
        editingCountry={country}
        onCountrySaved={onCountrySaved}
      />

      <button
        className="btn btn-light btn-icon btn-sm rounded-circle"
        title={country.isActive ? "Desactivar país" : "Activar país"}
        onClick={handleToggleCountry}
        disabled={isToggling}
      >
        {isToggling ? (
          <Spinner
            animation="border"
            size="sm"
            style={{ width: "16px", height: "16px" }}
          />
        ) : country.isActive ? (
          <FiTrash2 size={16} />
        ) : (
          <BsCheck2 size={16} />
        )}
      </button>
    </div>
  );
};

export default CountryActions;
