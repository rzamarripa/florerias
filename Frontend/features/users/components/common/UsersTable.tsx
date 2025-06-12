import React, { useEffect, useState } from 'react';
import { Search, MoreVertical, UserPlus, Download, RefreshCw, Filter, SquarePen, RefreshCcw, Lock, Eye } from 'lucide-react';
import { useUsersStore } from '@/stores/users';
import CreateUserModal from './AddUserModal';

const UsersTableWithStore: React.FC = () => {
    // Store hooks
    const {
        users,
        loading,
        error,
        pagination,
        getAllUsers,
        clearErrors,
    } = useUsersStore();

    // Local state
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);

    // Load users on mount
    useEffect(() => {
        getAllUsers();
    }, [getAllUsers]);

    // Handlers
    const handleRefresh = (): void => {
        getAllUsers(pagination.page, pagination.limit);
    };

    const handleAddUser = (): void => {
        setEditingUserId(null);
        setShowCreateModal(true);
    };

    const handleEditUser = (userId: string): void => {
        setEditingUserId(userId);
        setShowCreateModal(true);
    };

    const handleCloseModal = (): void => {
        setShowCreateModal(false);
        setEditingUserId(null);
    };

    const handleExport = (): void => {
        console.log('Exportar usuarios');
    };

    // Actions Dropdown Component
    const ActionsDropdown: React.FC<{ user: any }> = ({ user }) => {
        const [isOpen, setIsOpen] = useState<boolean>(false);
        const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

        // Close dropdown on scroll or resize
        useEffect(() => {
            const handleScrollOrResize = () => {
                if (isOpen) {
                    setIsOpen(false);
                }
            };

            if (isOpen) {
                window.addEventListener('scroll', handleScrollOrResize, true);
                window.addEventListener('resize', handleScrollOrResize);
            }

            return () => {
                window.removeEventListener('scroll', handleScrollOrResize, true);
                window.removeEventListener('resize', handleScrollOrResize);
            };
        }, [isOpen]);

        const handleToggle = (e: React.MouseEvent) => {
            if (!isOpen) {
                const button = e.currentTarget as HTMLElement;
                const rect = button.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                // Calculate position relative to viewport
                let top = rect.bottom + 5;
                let right = viewportWidth - rect.right;

                // Adjust if dropdown would go off-screen
                if (top + 200 > viewportHeight) {
                    top = rect.top - 200;
                }

                if (right < 0) {
                    right = 10;
                }

                setDropdownPosition({ top, right });
            }
            setIsOpen(!isOpen);
        };

        const handleAction = (action: string): void => {
            setIsOpen(false);

            switch (action) {
                case 'Ver detalles':
                    console.log('Ver detalles usuario:', user.username);
                    break;
                case 'Editar':
                    handleEditUser(user._id);
                    break;
                case 'Cambiar rol':
                    console.log('Cambiar rol usuario:', user.username);
                    break;
                case 'Desactivar':
                case 'Activar':
                    console.log(`${action} usuario:`, user.username);
                    break;
                default:
                    console.log(`${action} usuario:`, user.username);
            }
        };

        return (
            <>
                <div className="dropdown-container">
                    <button
                        className="btn btn-light btn-sm border-0 rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: '32px', height: '32px' }}
                        onClick={handleToggle}
                    >
                        <MoreVertical size={16} className="text-muted" />
                    </button>
                </div>

                {isOpen && (
                    <>
                        <div
                            className="position-fixed w-100 h-100"
                            style={{ top: 0, left: 0, zIndex: 1040 }}
                            onClick={() => setIsOpen(false)}
                        />
                        <div
                            className="dropdown-menu-portal show shadow-lg border-0 rounded-3"
                            style={{
                                position: 'fixed',
                                top: `${dropdownPosition.top}px`,
                                right: `${dropdownPosition.right}px`,
                                zIndex: 1050,
                                minWidth: '180px',
                                maxHeight: '300px',
                                overflowY: 'auto',
                                background: 'white',
                                border: '1px solid rgba(0,0,0,0.1)',
                                borderRadius: '12px',
                                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                                padding: '0.5rem 0'
                            }}
                        >
                            <h6 className="dropdown-header text-muted fw-semibold">Acciones</h6>
                            <button
                                className="dropdown-item py-2 border-0 bg-transparent"
                                onClick={() => handleAction('Ver detalles')}
                            >
                                <i className="me-2"><Eye /></i>Ver Detalles
                            </button>
                            <button
                                className="dropdown-item py-2 border-0 bg-transparent"
                                onClick={() => handleAction('Editar')}
                            >
                                <i className="me-2"><SquarePen /></i>Editar Usuario
                            </button>
                            <button
                                className="dropdown-item py-2 border-0 bg-transparent"
                                onClick={() => handleAction('Cambiar rol')}
                            >
                                <i className="me-2"><RefreshCcw /></i>Cambiar Rol
                            </button>
                            <div className="dropdown-divider my-1" />
                            <button
                                className={`dropdown-item py-2 border-0 bg-transparent ${user.profile.estatus ? 'text-danger' : 'text-success'}`}
                                onClick={() => handleAction(user.profile.estatus ? 'Desactivar' : 'Activar')}
                            >
                                <i className="me-2">{user.profile.estatus ? <Lock /> : <Lock />}</i>
                                {user.profile.estatus ? 'Desactivar' : 'Activar'}
                            </button>
                        </div>
                    </>
                )}
            </>
        );
    };

    // Role Badge Component
    const RoleBadge: React.FC<{ role?: { name: string } }> = ({ role }) => {
        const getRoleStyle = (roleName?: string): object => {
            const baseStyle = {
                background: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)',
                fontSize: '0.75rem'
            };

            switch (roleName) {
                case 'SuperAdmin':
                case 'Super Admin':
                    return { ...baseStyle, opacity: 1 };
                case 'Gerente':
                    return { ...baseStyle, opacity: 0.9 };
                case 'Egresos':
                    return { ...baseStyle, opacity: 0.8 };
                case 'Sin rol':
                    return { ...baseStyle, opacity: 0.6 };
                default:
                    return { ...baseStyle, opacity: 0.7 };
            }
        };

        return (
            <span
                className="badge fw-normal px-3 py-2 rounded-pill text-white"
                style={getRoleStyle(role?.name)}
            >
                {role?.name || 'Sin rol'}
            </span>
        );
    };

    // Status Badge Component
    const StatusBadge: React.FC<{ status: boolean }> = ({ status }) => (
        <span
            className="badge fw-normal px-3 py-2 rounded-pill text-white"
            style={{
                background: status
                    ? 'linear-gradient(135deg, #059669 0%, #0891b2 100%)'
                    : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                fontSize: '0.75rem',
                opacity: status ? 1 : 0.9
            }}
        >
            <i className={`me-1 ${status ? '🟢' : '🔴'}`} style={{ fontSize: '8px' }} />
            {status ? 'Activo' : 'Inactivo'}
        </span>
    );

    return (
        <div className="container-fluid bg-light min-vh-100 py-4">
            {/* Error Alert */}
            {error && (
                <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                    <strong>Error:</strong> {error}
                    <button
                        type="button"
                        className="btn-close"
                        onClick={clearErrors}
                        aria-label="Close"
                    />
                </div>
            )}

            {/* Page Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center">
                    <div
                        className="rounded-4 p-3 me-3 d-flex align-items-center justify-content-center text-white"
                        style={{
                            background: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)',
                            width: '56px',
                            height: '56px'
                        }}
                    >
                        <span className="fs-4">👥</span>
                    </div>
                    <div>
                        <h1 className="h3 mb-1 fw-bold text-dark">
                            Usuarios
                            <span className="badge bg-light text-muted ms-2 rounded-pill border">
                                {users.length}
                            </span>
                        </h1>
                        <p className="text-muted mb-0 small">Su Rol: SuperAdmin</p>
                    </div>
                </div>

                <div className="d-flex gap-2">
                    <button
                        className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        <RefreshCw size={14} className={`me-1 ${loading ? 'spin' : ''}`} />
                        Actualizar
                    </button>
                    <button
                        className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                        onClick={handleExport}
                    >
                        <Download size={14} className="me-1" />
                        Exportar
                    </button>
                    <button
                        className="btn btn-sm rounded-pill px-3 fw-semibold text-white"
                        onClick={handleAddUser}
                        style={{
                            background: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)',
                            border: 'none'
                        }}
                    >
                        <UserPlus size={14} className="me-1" />
                        Nuevo Usuario
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body p-4">
                    <div className="row g-3">
                        <div className="col-md-6">
                            <div className="position-relative">
                                <Search
                                    size={16}
                                    className="position-absolute text-muted"
                                    style={{ top: '50%', left: '12px', transform: 'translateY(-50%)' }}
                                />
                                <input
                                    type="text"
                                    className="form-control border-0 bg-light rounded-pill ps-5"
                                    placeholder="Buscar usuarios..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ height: '42px' }}
                                />
                            </div>
                        </div>
                        <div className="col-md-3">
                            <select
                                className="form-select border-0 bg-light rounded-pill"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                style={{ height: '42px' }}
                            >
                                <option value="">Todos los roles</option>
                                <option value="SuperAdmin">Super Admin</option>
                                <option value="Gerente">Gerente</option>
                                <option value="Egresos">Egresos</option>
                                <option value="Sin rol">Sin rol</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <select
                                className="form-select border-0 bg-light rounded-pill"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{ height: '42px' }}
                            >
                                <option value="">Todos los estados</option>
                                <option value="true">Activo</option>
                                <option value="false">Inactivo</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="text-center py-5">
                    <div className="spinner-border" style={{ color: '#0891b2' }} role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="text-muted mt-2">Cargando usuarios...</p>
                </div>
            )}

            {/* Table Card */}
            <div className="card border-0 shadow-sm rounded-4" style={{ overflow: 'visible' }}>
                <div className="table-responsive-wrapper">
                    <table className="table table-hover mb-0">
                        <thead className="table-light">
                            <tr>
                                <th className="border-0 px-4 py-3 text-muted fw-semibold">#</th>
                                <th className="border-0 px-4 py-3 text-muted fw-semibold">Rol</th>
                                <th className="border-0 px-4 py-3 text-muted fw-semibold">Usuario</th>
                                <th className="border-0 px-4 py-3 text-muted fw-semibold">Nombre Completo</th>
                                <th className="border-0 px-4 py-3 text-muted fw-semibold">Departamento</th>
                                <th className="border-0 px-4 py-3 text-muted fw-semibold">Fecha Creación</th>
                                <th className="border-0 px-4 py-3 text-muted fw-semibold text-center">Estatus</th>
                                <th className="border-0 px-4 py-3 text-muted fw-semibold text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-5">
                                        <div className="text-muted">
                                            <div className="mb-3">📭</div>
                                            <h6>No se encontraron usuarios</h6>
                                            <p className="small mb-0">Intenta ajustar los filtros de búsqueda</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.map((user, index) => (
                                    <tr key={user._id} className="border-0">
                                        <td className="px-4 py-4">
                                            <span className="fw-semibold text-dark">
                                                {(pagination.page - 1) * pagination.limit + index + 1}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <RoleBadge role={user.role} />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="d-flex align-items-center">
                                                <div
                                                    className="rounded-circle d-flex align-items-center justify-content-center me-3 text-white"
                                                    style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        background: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)',
                                                        opacity: 0.8
                                                    }}
                                                >
                                                    <span className="fw-bold small">
                                                        {user.username.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className="fw-semibold" style={{ color: '#0891b2' }}>{user.username}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-dark">{user.profile.nombreCompleto || user.profile.nombre}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-muted">{user.department || 'No especificado'}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-muted small">
                                                {new Date(user.createdAt).toLocaleDateString('es-ES', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <StatusBadge status={user.profile.estatus} />
                                        </td>
                                        <td className="px-4 py-4 text-center position-relative">
                                            <ActionsDropdown user={user} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {pagination.pages > 1 && (
                    <div className="card-footer border-0 bg-transparent px-4 py-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted small">
                                Mostrando {users.length} de {pagination.total} usuarios
                            </span>
                            <nav>
                                <ul className="pagination pagination-sm mb-0">
                                    <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link border-0 rounded-pill me-1"
                                            onClick={() => console.log('Página anterior')}
                                            disabled={pagination.page === 1}
                                        >
                                            Anterior
                                        </button>
                                    </li>

                                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                                        const pageNum = i + 1;
                                        return (
                                            <li key={pageNum} className={`page-item ${pagination.page === pageNum ? 'active' : ''}`}>
                                                <button
                                                    className="page-link border-0 rounded-pill mx-1"
                                                    onClick={() => console.log('Ir a página', pageNum)}
                                                >
                                                    {pageNum}
                                                </button>
                                            </li>
                                        );
                                    })}

                                    <li className={`page-item ${pagination.page === pagination.pages ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link border-0 rounded-pill ms-1"
                                            onClick={() => console.log('Página siguiente')}
                                            disabled={pagination.page === pagination.pages}
                                        >
                                            Siguiente
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit User Modal */}
            <CreateUserModal
                isOpen={showCreateModal}
                onClose={handleCloseModal}
                editingUserId={editingUserId}
            />

            <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .table-responsive-wrapper {
          overflow-x: auto;
          overflow-y: visible;
          max-width: 100%;
          border-radius: 16px;
        }

        .table {
          min-width: 100%;
          margin-bottom: 0;
          white-space: nowrap;
        }

        .table th,
        .table td {
          padding: 1rem 0.75rem;
          vertical-align: middle;
        }

        .table th:first-child,
        .table td:first-child {
          padding-left: 1.5rem;
        }

        .table th:last-child,
        .table td:last-child {
          padding-right: 1.5rem;
          position: relative;
        }

        .table tbody tr:hover {
          background-color: rgba(8, 145, 178, 0.08) !important;
        }

        .dropdown-container {
          position: relative;
          display: inline-block;
        }

        .dropdown-menu-portal {
          position: fixed !important;
          background: white;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          padding: 0.5rem 0;
          z-index: 1050;
        }

        .dropdown-item {
          display: block;
          width: 100%;
          padding: 0.5rem 1rem;
          clear: both;
          font-weight: 400;
          color: #374151;
          text-align: inherit;
          text-decoration: none;
          white-space: nowrap;
          background-color: transparent;
          border: 0;
          cursor: pointer;
          transition: all 0.15s ease-in-out;
        }

        .dropdown-item:hover {
          background-color: rgba(8, 145, 178, 0.15) !important;
          border-radius: 8px;
          margin: 0 0.5rem;
        }

        .dropdown-header {
          display: block;
          padding: 0.5rem 1rem;
          margin-bottom: 0;
          font-size: 0.875rem;
          color: #6b7280;
          white-space: nowrap;
        }

        .dropdown-divider {
          height: 0;
          margin: 0.5rem 0;
          overflow: hidden;
          border-top: 1px solid #e5e7eb;
        }

        .btn:focus {
          box-shadow: none;
        }

        .form-control:focus,
        .form-select:focus {
          border-color: #0891b2;
          box-shadow: 0 0 0 0.2rem rgba(8, 145, 178, 0.15);
        }

        .page-link {
          color: #0891b2;
        }

        .page-link:hover {
          color: #059669;
          background-color: rgba(8, 145, 178, 0.1);
        }

        .page-item.active .page-link {
          background: linear-gradient(135deg, #059669 0%, #0891b2 100%);
          border-color: #0891b2;
          color: white;
        }

        /* Responsive adjustments */
        @media (max-width: 1200px) {
          .table {
            min-width: 800px;
          }
        }

        @media (max-width: 768px) {
          .table {
            min-width: 600px;
            font-size: 0.875rem;
          }
          
          .table th,
          .table td {
            padding: 0.75rem 0.5rem;
          }
          
          .badge {
            font-size: 0.7rem !important;
          }
        }

        @media (max-width: 576px) {
          .table {
            min-width: 500px;
            font-size: 0.8rem;
          }
          
          .table th,
          .table td {
            padding: 0.5rem 0.25rem;
          }

          .table th:first-child,
          .table td:first-child {
            padding-left: 0.75rem;
          }

          .table th:last-child,
          .table td:last-child {
            padding-right: 0.75rem;
          }
        }

        /* Ensure no overflow issues */
        .card {
          overflow: visible;
        }

        .card-body {
          overflow: visible;
        }

        /* Better text wrapping for smaller screens */
        @media (max-width: 992px) {
          .table td:nth-child(4),
          .table th:nth-child(4) {
            max-width: 150px;
            white-space: normal;
            word-wrap: break-word;
          }
        }
      `}</style>
        </div>
    );
};

export default UsersTableWithStore;