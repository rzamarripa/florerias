"use client";

import React, { useEffect, useState } from "react";
import { Button, Card, Table } from "react-bootstrap";
import { toast } from "react-toastify";
import { routeService } from "./services/routeService";
import { Route } from "./types";
import RouteActions from "./RouteActions";
import RouteModal from "./components/RouteModal";

const Routes: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      const response = await routeService.getAllRoutes();

      if (!response.success) {
        toast.error(response.message || "Error al cargar rutas");
        return;
      }

      setRoutes(response.data || []);
    } catch (error: any) {
      toast.error(
        "Error al cargar rutas: " + (error.message || "Error desconocido")
      );
      console.error("Error loading routes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewRoute = () => {
    setEditingRoute(null);
    setShowForm(true);
  };

  const handleEditRoute = (route: Route) => {
    setEditingRoute(route);
    setShowForm(true);
  };

  const handleModalClose = () => {
    setShowForm(false);
    setEditingRoute(null);
  };

  return (
    <div>
      <Card className="mb-4">
        <Card.Header>
          <div className="d-flex align-items-center">
            <div>
              <h4 className="card-title">Gestión de Rutas</h4>
              <p className="text-muted mb-0">
                Administra las rutas de distribución por marca, empresa y sucursal.
              </p>
            </div>
            
          </div>
          <div className="ms-auto">
              <Button
                variant="primary"
                onClick={handleNewRoute}
                disabled={loading}
              >
                Nueva Ruta
              </Button>
            </div>
        </Card.Header>
      </Card>

      <RouteModal
        show={showForm}
        onHide={handleModalClose}
        editingRoute={editingRoute}
        onRouteSaved={loadRoutes}
      />

      <Card>
        <Card.Header>
          <h5 className="card-title">Lista de Rutas</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-2">Cargando rutas...</p>
            </div>
          ) : (
            <Table responsive striped>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Marca</th>
                  <th>Empresa</th>
                  <th>Sucursal</th>
                  <th>Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {routes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center">
                      No hay rutas disponibles
                    </td>
                  </tr>
                ) : (
                  routes.map((route) => (
                    <tr key={route._id}>
                      <td>{route.name}</td>
                      <td>{route.description || "-"}</td>
                      <td>{route.brandId.name}</td>
                      <td>{route.companyId.name}</td>
                      <td>{route.branchId.name}</td>
                      <td>
                        <span
                          className={`badge ${
                            route.status ? "bg-success" : "bg-danger"
                          }`}
                        >
                          {route.status ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>
                        <RouteActions
                          route={route}
                          onRouteSaved={loadRoutes}
                          onEdit={handleEditRoute}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default Routes; 