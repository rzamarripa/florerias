"use client";
import Link from "next/link";
import { useState } from "react";
import AppLogo from "@/components/ui/AppLogo";

export default function Page() {
  // Estado para el formulario de contacto (solo frontend)
  const [form, setForm] = useState({ nombre: "", correo: "", mensaje: "" });
  const [enviado, setEnviado] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEnviado(true);
    // Aquí podrías conectar con un backend o servicio de tickets
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-lg-8 text-center mb-5">
          <div className="mb-4">
            <AppLogo />
          </div>
          <h2 className="mb-4 text-primary">
            La tranquilidad financiera que tu empresa merece
          </h2>
          <p className="lead mb-4">
            FinFlow es la plataforma confiable para la gestión de presupuestos,
            conciliación bancaria y control de egresos. Centraliza y automatiza
            tus procesos financieros, asegurando transparencia, orden y control
            en cada movimiento. Toma decisiones informadas y lleva la
            administración de tu empresa al siguiente nivel.
          </p>
          <Link href="/iniciar-sesion" className="btn btn-primary btn-lg mb-4">
            Iniciar Sesión
          </Link>
        </div>
        <div className="col-lg-10 mx-auto mb-5">
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">
                    ¿Qué puedes lograr con Caprepa?
                  </h5>
                  <ul className="text-start mb-0">
                    <li>
                      Gestiona y controla tus presupuestos de forma eficiente
                    </li>
                    <li>Realiza conciliaciones bancarias precisas y rápidas</li>
                    <li>Automatiza pagos y controla egresos sin errores</li>
                    <li>Obtén reportes claros y visibilidad en tiempo real</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Confianza para tu equipo</h5>
                  <ul className="text-start mb-0">
                    <li>
                      Dirección financiera: supervisión total y toma de
                      decisiones seguras
                    </li>
                    <li>
                      Departamentos: control y seguimiento de recursos asignados
                    </li>
                    <li>Tesorería: procesos ágiles y sin complicaciones</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">
                    Beneficios que marcan la diferencia
                  </h5>
                  <ul className="text-start mb-0">
                    <li>Transparencia y trazabilidad en cada operación</li>
                    <li>Reducción de errores y tareas manuales</li>
                    <li>Seguridad y confidencialidad de tu información</li>
                    <li>Soporte profesional cuando lo necesites</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-8 mx-auto">
          <div className="card shadow-sm">
            <div className="card-body">
              <h4 className="mb-3">
                ¿Necesitas ayuda o tienes alguna consulta?
              </h4>
              {enviado ? (
                <div className="alert alert-success">
                  ¡Tu mensaje ha sido enviado! Nos pondremos en contacto contigo
                  pronto.
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3 text-start">
                    <label className="form-label">Nombre</label>
                    <input
                      type="text"
                      className="form-control"
                      name="nombre"
                      value={form.nombre}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="mb-3 text-start">
                    <label className="form-label">Correo electrónico</label>
                    <input
                      type="email"
                      className="form-control"
                      name="correo"
                      value={form.correo}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="mb-3 text-start">
                    <label className="form-label">Mensaje</label>
                    <textarea
                      className="form-control"
                      name="mensaje"
                      rows={3}
                      value={form.mensaje}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-outline-primary w-100"
                  >
                    Solicitar contacto
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
