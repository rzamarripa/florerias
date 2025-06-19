import { Plus } from "lucide-react";
import React from "react";
import { BsPencil } from "react-icons/bs";

interface ButtonStyle {
  variant: string;
  className: string;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "lg";
}

interface ModalButtonStyles {
  create: ButtonStyle;
  edit: ButtonStyle;
}

export const getModalButtonStyles = (entityName: string): ModalButtonStyles => {
  return {
    create: {
      variant: "primary",
      className: "d-flex align-items-center gap-2 text-nowrap px-3",
      title: `Nuevo ${entityName}`,
      children: (
        <>
          <Plus size={18} />
          Nuevo {entityName}
        </>
      ),
    },
    edit: {
      variant: "light",
      size: "sm",
      className: "btn-icon rounded-circle",
      title: `Editar ${entityName.toLowerCase()}`,
      children: <BsPencil size={16} />,
    },
  };
};
