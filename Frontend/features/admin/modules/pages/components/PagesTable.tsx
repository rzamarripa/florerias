import React, { useState } from 'react';
import { Search, Plus, Edit, FileText, Home, Users,Building, Receipt,  } from 'lucide-react';

const PagesTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('todos');

  // Datos de las páginas basados en la imagen
  const paginasData = [
    { id: 1, nombre: 'Home', ruta: '/', tipo: 'Principal', icono: Home },
    { id: 2, nombre: 'Roles', ruta: '/roles', tipo: 'Administración', icono: Users },
    { id: 3, nombre: 'Pages', ruta: '/pages', tipo: 'Contenido', icono: FileText },
    { id: 4, nombre: 'Usuarios', ruta: '/usuarios', tipo: 'Administración', icono: Users },
    { id: 5, nombre: 'Empleados', ruta: '/empleados', tipo: 'Recursos Humanos', icono: Users },
    { id: 6, nombre: 'Proveedores', ruta: '/proveedores', tipo: 'Comercial', icono: Building },
    { id: 7, nombre: 'Departamentos', ruta: '/departamentos', tipo: 'Administración', icono: Building },
    { id: 8, nombre: 'FacturasDepto', ruta: '/facturasDepto', tipo: 'Facturación', icono: Receipt }
  ];

  const tiposUnicos = [...new Set(paginasData.map(p => p.tipo))];

  const filteredPaginas = paginasData.filter(pagina => {
    const matchesSearch = pagina.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pagina.ruta.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'todos' || pagina.tipo === selectedType;
    return matchesSearch && matchesType;
  });

  const getTipoColor = (tipo) => {
    const colors = {
      'Principal': '#007bff',
      'Administración': '#1ab394',
      'Contenido': '#17a2b8',
      'Recursos Humanos': '#ffc107',
      'Comercial': '#6c757d',
      'Facturación': '#dc3545',
      'Herramientas': '#343a40',
      'Configuración': '#f8f9fa'
    };
    return colors[tipo] || '#6c757d';
  };

  

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-0 pt-4 pb-3">
              <div className="row align-items-center">
                <div className="col">
                  <div className="d-flex align-items-center">
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ 
                        width: '48px', 
                        height: '48px', 
                        backgroundColor: '#1ab394',
                        color: 'white'
                      }}
                    >
                      <FileText size={24} />
                    </div>
                    <div>
                      <h2 className="mb-1 fw-bold text-dark">
                        Páginas 
                        <span 
                          className="badge ms-2"
                          style={{
                            backgroundColor: '#6c757d',
                            color: 'white',
                            fontSize: '0.75rem'
                          }}
                        >
                          {filteredPaginas.length}
                        </span>
                      </h2>
                      <p className="text-muted mb-0">Lista de páginas del sistema</p>
                    </div>
                  </div>
                </div>
                <div className="col-auto">
                  <button
                    className="btn btn-sm fw-semibold px-3"
                    style={{
                      backgroundColor: '#1ab394',
                      borderColor: '#1ab394',
                      color: 'white'
                    }}
                  >
                    <Plus size={16} className="me-2" />
                    Nueva Página
                  </button>
                </div>
              </div>
            </div>

            <div className="card-body px-4">
              {/* Filtros y búsqueda */}
              <div className="row mb-4">
                <div className="col-md-4">
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <Search size={16} className="text-muted" />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-0"
                      placeholder="Buscar páginas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <select
                    className="form-select"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    <option value="todos">Todos los tipos</option>
                    {tiposUnicos.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tabla */}
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr className="border-bottom-2">
                      <th className="fw-semibold text-muted py-3" style={{ fontSize: '0.875rem' }}>#</th>
                      <th className="fw-semibold text-muted py-3" style={{ fontSize: '0.875rem' }}>Tipo</th>
                      <th className="fw-semibold text-muted py-3" style={{ fontSize: '0.875rem' }}>Página</th>
                      <th className="fw-semibold text-muted py-3" style={{ fontSize: '0.875rem' }}>Ruta</th>
                      <th className="fw-semibold text-muted py-3" style={{ fontSize: '0.875rem' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPaginas.map((pagina) => {
                      const IconComponent = pagina.icono;
                      return (
                        <tr key={pagina.id} className="border-bottom">
                          <td className="py-3 align-middle">
                            <span className="text-muted fw-medium">{pagina.id}</span>
                          </td>
                          <td className="py-3 align-middle">
                            <span 
                              className="badge fw-semibold px-3 py-2"
                              style={{ 
                                backgroundColor: getTipoColor(pagina.tipo),
                                color: pagina.tipo === 'Configuración' ? '#000' : '#fff',
                                fontSize: '0.75rem'
                              }}
                            >
                              {pagina.tipo}
                            </span>
                          </td>
                          <td className="py-3 align-middle">
                            <div className="d-flex align-items-center">
                              <div 
                                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                style={{ 
                                  width: '40px', 
                                  height: '40px', 
                                  backgroundColor: '#f8f9fa',
                                  color: '#1ab394',
                                  border: '2px solid #e9ecef'
                                }}
                              >
                                <IconComponent size={16} />
                              </div>
                              <div>
                                <div className="fw-semibold text-dark mb-0">{pagina.nombre}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 align-middle">
                            <code 
                              className="text-muted px-2 py-1 rounded"
                              style={{ backgroundColor: '#f8f9fa' }}
                            >
                              {pagina.ruta}
                            </code>
                          </td>
                          <td className="py-3 align-middle">
                            <button className="btn btn-outline-primary btn-sm me-2">
                              <Edit size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredPaginas.length === 0 && (
                <div className="text-center py-5">
                  <FileText size={48} className="text-muted mb-3" />
                  <h5 className="text-muted">No se encontraron páginas</h5>
                  <p className="text-muted">Intenta cambiar los filtros de búsqueda</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .card {
          border-radius: 0.5rem;
          box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
        }
        
        .table th {
          border-top: none;
          font-weight: 600;
          color: #6c757d;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .table td {
          vertical-align: middle;
          border-color: #e9ecef;
        }
        
        .table-hover tbody tr:hover {
          background-color: #f8f9fa;
        }
        
        .border-bottom-2 {
          border-bottom: 2px solid #e9ecef !important;
        }
        
        .input-group-text {
          background-color: #f8f9fa;
          border-color: #e9ecef;
        }
        
        .form-control:focus,
        .form-select:focus {
          border-color: #1ab394;
          box-shadow: 0 0 0 0.2rem rgba(26, 179, 148, 0.25);
        }
        
        .btn:focus {
          box-shadow: 0 0 0 0.2rem rgba(26, 179, 148, 0.25);
        }
        
        .btn-outline-primary {
          border-color: #1ab394;
          color: #1ab394;
        }
        
        .btn-outline-primary:hover {
          background-color: #1ab394;
          border-color: #1ab394;
          color: white;
        }
        
        code {
          font-size: 0.85em;
          color: #6c757d;
        }
        
        .badge {
          border-radius: 0.375rem;
        }
        
        .card-header {
          background-color: white;
          border-bottom: 1px solid #e9ecef;
        }
        
        .text-muted {
          color: #6c757d !important;
        }
        
        .fw-bold {
          font-weight: 700 !important;
        }
        
        .fw-semibold {
          font-weight: 600 !important;
        }
        
        .fw-medium {
          font-weight: 500 !important;
        }
      `}</style>
    </div>
  );
};

export default PagesTable;