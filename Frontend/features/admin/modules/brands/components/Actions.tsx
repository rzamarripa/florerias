import { BsCheck2 } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import { Brand } from "../types";
import BrandModal from "./BrandModal";

interface ActionsProps {
  brand: Brand;
  onToggleStatus: (brand: Brand) => Promise<void>;
  onBrandSaved: () => void;
}

export const Actions = ({
  brand,
  onToggleStatus,
  onBrandSaved,
}: ActionsProps) => {
  return (
    <div className="d-flex justify-content-center gap-1">
      <BrandModal brand={brand} mode="edit" onBrandSaved={onBrandSaved} />
      {brand.isActive ? (
        <button
          className="btn btn-light btn-icon btn-sm rounded-circle"
          title="Desactivar marca"
          onClick={(e) => {
            e.preventDefault();
            onToggleStatus(brand);
          }}
          tabIndex={0}
        >
          <FiTrash2 size={16} />
        </button>
      ) : (
        <button
          className="btn btn-light btn-icon btn-sm rounded-circle"
          title="Activar marca"
          onClick={(e) => {
            e.preventDefault();
            onToggleStatus(brand);
          }}
          tabIndex={0}
        >
          <BsCheck2 size={16} />
        </button>
      )}
    </div>
  );
};
