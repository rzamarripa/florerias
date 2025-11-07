"use client";

import { ChildrenType } from "@/types";
import { ToastContainer } from "react-toastify";
import { PermissionProvider } from "@/components/providers/PermissionProvider";
import { useEffect } from "react";

const AppWrapper = ({ children }: ChildrenType) => {
  // Forzar reset del tema al tema moderno una sola vez
  useEffect(() => {
    const themeResetKey = "__THEME_RESET_V1__";
    const hasReset = localStorage.getItem(themeResetKey);
    
    if (!hasReset) {
      // Eliminar configuración antigua
      localStorage.removeItem("__INSPINIA_NEXT_CONFIG__");
      // Marcar como reseteado
      localStorage.setItem(themeResetKey, "true");
      console.log("Tema reseteado al tema moderno");
    }
  }, []);

  return (
    <PermissionProvider>
      <div>
        {children}
        <ToastContainer
          position="top-right"
          autoClose={2000}
          hideProgressBar
          closeOnClick
          pauseOnFocusLoss
          pauseOnHover
        />
      </div>
    </PermissionProvider>
  );
};

export default AppWrapper;
