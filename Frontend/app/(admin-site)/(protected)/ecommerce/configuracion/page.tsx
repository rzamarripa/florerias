"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConfiguracionPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir automáticamente a la página de diseño
    router.push("/ecommerce/configuracion/diseno");
  }, [router]);

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Cargando...</span>
      </div>
    </div>
  );
}