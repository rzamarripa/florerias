"use client";
import { useUserModulesStore } from "@/stores/userModulesStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { ReactNode } from "react";
import { Alert, Button } from "react-bootstrap";
import { TbLock, TbArrowLeft } from "react-icons/tb";
import { useRouter } from "next/navigation";

interface ProtectedModuleProps {
    children: ReactNode;
    moduleName: string;
    requiredPermissions?: string[];
    allowedRoles?: string[];
}

const ProtectedModule = ({
    children,
    moduleName,
    requiredPermissions = [],
    allowedRoles = [],
}: ProtectedModuleProps) => {
    const router = useRouter();
    const { allowedModules } = useUserModulesStore();
    const { hasRole, getIsAdmin, getIsSuperAdmin, role } = useUserRoleStore();
    const { user, isAuthenticated } = useUserSessionStore();

    if (!isAuthenticated || !user) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
                <Alert variant="warning" className="text-center">
                    <TbLock className="fs-2 mb-2" />
                    <h5>Autenticación requerida</h5>
                    <p>Debes iniciar sesión para acceder a este módulo.</p>
                </Alert>
            </div>
        );
    }

    // Verificar si es Super Admin normalizando el rol
    const normalizedRole = role?.toLowerCase().replace(/\s+/g, '');
    const isSuperAdmin = normalizedRole === 'superadmin';
    const isAdmin = normalizedRole === 'admin' || isSuperAdmin;

    // Verificar si el módulo está en la lista de módulos permitidos
    // Los Super Admins tienen acceso automático a todos los módulos
    const hasModuleAccess = isSuperAdmin ||
        allowedModules?.some((module: any) =>
            module.name === moduleName || module.moduleName === moduleName
        );

    // Verificar si el usuario tiene el rol requerido
    const hasRoleAccess = allowedRoles.length === 0 ||
        allowedRoles.some(roleName => hasRole(roleName));

    // Verificar permisos específicos del módulo
    // Los Super Admins tienen todos los permisos automáticamente
    const hasPermissionAccess = isSuperAdmin ||
        requiredPermissions.length === 0 ||
        allowedModules?.some((module: any) => {
            if (module.name === moduleName || module.moduleName === moduleName) {
                return requiredPermissions.every(permission =>
                    module.permissions?.includes(permission)
                );
            }
            return false;
        });

    // Debug logging
    console.log('=== DEBUGGING PROTECTEDMODULE ===');
    console.log('moduleName:', moduleName);
    console.log('role:', role);
    console.log('normalizedRole:', normalizedRole);
    console.log('isSuperAdmin:', isSuperAdmin);
    console.log('allowedModules:', allowedModules);
    console.log('hasModuleAccess:', hasModuleAccess);
    console.log('hasRoleAccess:', hasRoleAccess);
    console.log('hasPermissionAccess:', hasPermissionAccess);
    console.log('requiredPermissions:', requiredPermissions);
    console.log('================================');

    if (!hasModuleAccess || !hasRoleAccess || !hasPermissionAccess) {
        return (
            <div className="container-fluid p-4">
                <div className="row justify-content-center">
                    <div className="col-md-6">
                        <Alert variant="danger" className="text-center">
                            <TbLock className="fs-1 mb-3 text-danger" />
                            <h4 className="alert-heading">Acceso Denegado</h4>
                            <p className="mb-3">
                                No tienes permisos para acceder al módulo <strong>{moduleName}</strong>.
                            </p>

                            <hr />

                            <div className="mb-3">
                                <small className="text-muted">
                                    <strong>Usuario:</strong> {user?.username || 'N/A'}<br />
                                    <strong>Rol:</strong> {role || 'No asignado'}<br />
                                    <strong>Módulo solicitado:</strong> {moduleName}
                                </small>
                            </div>

                            <Button
                                variant="outline-secondary"
                                onClick={() => router.back()}
                                className="me-2"
                            >
                                <TbArrowLeft className="me-1" />
                                Volver
                            </Button>

                            <Button
                                variant="primary"
                                onClick={() => router.push('/dashboard')}
                            >
                                Ir al Dashboard
                            </Button>
                        </Alert>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default ProtectedModule;