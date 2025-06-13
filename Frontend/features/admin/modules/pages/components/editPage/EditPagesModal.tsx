import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Table } from 'react-bootstrap';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { pagesService, UpdatePageData } from '../../services/pages';
import { modulesService, CreateModuleData, Module } from '../../services/modules';
import styles from '../addpage/addpage.module.css';

// Schema para validación
const updatePageSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  path: z.string().min(1, 'La ruta es requerida'),
  description: z.string().optional()
});

interface UpdatePageFormData {
  name: string;
  path: string;
  description: string;
}

interface ModuleRow {
  id: string;
  nombre: string;
  description: string;
  isExisting?: boolean; // Para distinguir entre módulos existentes y nuevos
}

interface EditPageModalProps {
  show: boolean;
  onHide: () => void;
  onPageUpdated: () => void;
  pageId: string | null;
}

const EditPageModal: React.FC<EditPageModalProps> = ({ 
  show, 
  onHide, 
  onPageUpdated, 
  pageId 
}) => {
  const [formData, setFormData] = useState<UpdatePageFormData>({
    name: '',
    path: '',
    description: ''
  });
  
  const [existingModules, setExistingModules] = useState<ModuleRow[]>([]);
  const [newModules, setNewModules] = useState<ModuleRow[]>([]);
  const [currentModule, setCurrentModule] = useState({ nombre: '', description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingPage, setLoadingPage] = useState(false);
  const [deletingModules, setDeletingModules] = useState<Set<string>>(new Set());

  // Cargar datos de la página cuando se abre el modal
  useEffect(() => {
    if (show && pageId) {
      loadPageData();
    } else if (!show) {
      // Limpiar estados cuando se cierre el modal
      setFormData({ name: '', path: '', description: '' });
      setExistingModules([]);
      setNewModules([]);
      setCurrentModule({ nombre: '', description: '' });
      setErrors({});
      setDeletingModules(new Set());
    }
  }, [show, pageId]);

  const loadPageData = async () => {
    if (!pageId) {
      console.error('ERROR: No pageId provided to loadPageData');
      return;
    }
    
    try {
      setLoadingPage(true);
      console.log('=== CARGANDO DATOS DE PÁGINA ===');
      console.log('pageId:', pageId, 'tipo:', typeof pageId);
      
      // Cargar datos de la página
      const pageResponse = await pagesService.getPageById(pageId);
      console.log('Respuesta página:', pageResponse);
      
      if (pageResponse.success && pageResponse.data) {
        const page = pageResponse.data;
        console.log('✅ Datos de página cargados correctamente:', page);
        
        setFormData({
          name: page.name,
          path: page.path,
          description: page.description || ''
        });
      } else {
        throw new Error('No se pudieron cargar los datos de la página');
      }

      // Cargar módulos de la página
      console.log('Cargando módulos para pageId:', pageId);
      const modulesResponse = await modulesService.getModulesByPage(pageId, { limit: 100 });
      console.log('Respuesta módulos RAW:', modulesResponse);
      
      if (modulesResponse.success && modulesResponse.data) {
        console.log('Módulos recibidos de la API:', modulesResponse.data);
        
        const modules = modulesResponse.data
          .filter((module: Module) => {
            const isValid = module && module._id && typeof module._id === 'string' && module._id.trim() !== '';
            if (!isValid) {
              console.warn('❌ Módulo descartado por ID inválido:', module);
            }
            return isValid;
          })
          .map((module: Module) => {
            const moduleRow = {
              id: module._id, // Este es el ID que se usará para eliminar
              nombre: module.name || 'Sin nombre',
              description: module.description || '',
              isExisting: true
            };
            console.log('✅ Módulo procesado:', moduleRow);
            return moduleRow;
          });
          
        console.log('=== MÓDULOS FINALES CARGADOS ===');
        console.log('Cantidad:', modules.length);
        console.log('IDs de módulos:', modules.map(m => m.id));
        
        setExistingModules(modules);
      } else {
        console.log('No se encontraron módulos o error en la respuesta');
        setExistingModules([]);
      }
    } catch (error) {
      console.error('❌ ERROR cargando datos de página:', error);
      setErrors({ general: 'Error al cargar los datos de la página: ' + (error instanceof Error ? error.message : 'Error desconocido') });
    } finally {
      setLoadingPage(false);
    }
  };

  const handleInputChange = (field: keyof UpdatePageFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleAddModule = () => {
    if (currentModule.nombre.trim()) {
      const newModule: ModuleRow = {
        id: `new_${Date.now()}`, // Prefix para distinguir IDs nuevos
        nombre: currentModule.nombre.trim(),
        description: currentModule.description.trim(),
        isExisting: false
      };
      
      console.log('Agregando nuevo módulo:', newModule); // Debug log
      setNewModules(prev => [...prev, newModule]);
      setCurrentModule({ nombre: '', description: '' });
      
      // Limpiar errores si había alguno
      if (errors.general) {
        setErrors(prev => ({ ...prev, general: '' }));
      }
    }
  };

  const handleRemoveNewModule = (id: string) => {
    setNewModules(prev => prev.filter(module => module.id !== id));
  };

  const handleRemoveExistingModule = async (moduleId: string) => {
    // Validaciones estrictas ANTES de hacer la petición
    if (!pageId) {
      console.error('ERROR: pageId is missing or undefined:', pageId);
      setErrors({ general: 'Error: ID de página faltante' });
      return;
    }
    
    if (!moduleId) {
      console.error('ERROR: moduleId is missing or undefined:', moduleId);
      setErrors({ general: 'Error: ID de módulo faltante' });
      return;
    }
    
    // Validar que ambos sean strings válidos y no vacíos
    if (typeof pageId !== 'string' || pageId.trim() === '') {
      console.error('ERROR: pageId is not a valid string:', pageId);
      setErrors({ general: 'Error: ID de página inválido' });
      return;
    }
    
    if (typeof moduleId !== 'string' || moduleId.trim() === '') {
      console.error('ERROR: moduleId is not a valid string:', moduleId);
      setErrors({ general: 'Error: ID de módulo inválido' });
      return;
    }
    
    try {
      console.log('=== INICIANDO ELIMINACIÓN ===');
      console.log('pageId:', pageId, 'tipo:', typeof pageId);
      console.log('moduleId:', moduleId, 'tipo:', typeof moduleId);
      
      setDeletingModules(prev => new Set(prev).add(moduleId));
      
      // USAR EL SERVICIO CORRECTO para eliminar de la base de datos
      console.log('Llamando a pagesService.removeModuleFromPage...');
      const response = await pagesService.removeModuleFromPage(pageId, moduleId);
      
      console.log('Respuesta de la API:', response);
      
      if (response.success) {
        console.log('✅ Módulo eliminado exitosamente de la base de datos');
        
        // SOLO DESPUÉS de eliminar exitosamente de la DB, eliminar del estado local
        setExistingModules(prev => prev.filter(module => module.id !== moduleId));
        
        // Limpiar errores si la operación fue exitosa
        if (errors.general) {
          setErrors(prev => ({ ...prev, general: '' }));
        }
      } else {
        throw new Error(response.message || 'Error al eliminar el módulo de la base de datos');
      }
    } catch (error) {
      console.error('❌ ERROR eliminando módulo:', error);
      
      // Mostrar error más específico
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error desconocido al eliminar el módulo';
        
      setErrors({ general: `Error al eliminar el módulo: ${errorMessage}` });
    } finally {
      // Siempre limpiar el estado de "eliminando"
      setDeletingModules(prev => {
        const newSet = new Set(prev);
        newSet.delete(moduleId);
        return newSet;
      });
    }
  };

  const validateForm = (): boolean => {
    try {
      updatePageSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !pageId) {
      return;
    }

    try {
      setLoading(true);
      
      // 1. Actualizar los datos básicos de la página
      const pageData: UpdatePageData = {
        name: formData.name,
        path: formData.path,
        description: formData.description || undefined
      };

      const pageResponse = await pagesService.updatePage(pageId, pageData);
      
      if (!pageResponse.success) {
        throw new Error('Error al actualizar la página');
      }

      // 2. Agregar nuevos módulos si los hay
      if (newModules.length > 0) {
        for (const mod of newModules) {
          const moduleData: CreateModuleData = {
            name: mod.nombre,
            description: mod.description,
            page: pageId
          };

          await modulesService.createModule(moduleData);
        }
      }
      
      // Resetear formulario
      setFormData({ name: '', path: '', description: '' });
      setExistingModules([]);
      setNewModules([]);
      setCurrentModule({ nombre: '', description: '' });
      setErrors({});
      
      onPageUpdated();
      onHide();
    } catch (error) {
      console.error('Error updating page:', error);
      setErrors({ general: error instanceof Error ? error.message : 'Error al actualizar la página' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', path: '', description: '' });
    setExistingModules([]);
    setNewModules([]);
    setCurrentModule({ nombre: '', description: '' });
    setErrors({});
    setDeletingModules(new Set());
    onHide();
  };

  const allModules = [...existingModules, ...newModules];

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      size="lg" 
      centered
      className={styles.modal}
    >
      <Modal.Header className={`${styles.modalHeader} border-0`}>
        <Modal.Title className={styles.modalTitle}>
          Actualizar página
        </Modal.Title>
        <Button
          variant="link"
          className={styles.closeButton}
          onClick={handleClose}
        >
          <X size={20} />
        </Button>
      </Modal.Header>

      <Modal.Body className={styles.modalBody}>
        {errors.general && (
          <div className="alert alert-danger">
            {errors.general}
          </div>
        )}

        {loadingPage ? (
          <div className="text-center py-5">
            <Loader2 
              size={32} 
              className="text-muted mb-2" 
              style={{ animation: "spin 1s linear infinite" }} 
            />
            <p className="text-muted">Cargando datos de la página...</p>
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className={styles.formLabel}>
                    Nombre de la página
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nombre de la página"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    isInvalid={!!errors.name}
                    className={styles.formControl}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className={styles.formLabel}>
                    Ruta de la página
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ruta de la página"
                    value={formData.path}
                    onChange={(e) => handleInputChange('path', e.target.value)}
                    isInvalid={!!errors.path}
                    className={styles.formControl}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.path}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col>
                <Form.Group>
                  <Form.Label className={styles.formLabel}>
                    Descripción (opcional)
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Descripción de la página"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={styles.formControl}
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="mb-4">
              <h5 className={styles.sectionTitle}>Módulos de la página</h5>
              
              <Row className="mb-3">
                <Col md={5}>
                  <Form.Group>
                    <Form.Label className={styles.formLabel}>
                      Nombre del módulo
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Nombre del módulo"
                      value={currentModule.nombre}
                      onChange={(e) => setCurrentModule(prev => ({ ...prev, nombre: e.target.value }))}
                      className={styles.formControl}
                    />
                  </Form.Group>
                </Col>
                <Col md={5}>
                  <Form.Group>
                    <Form.Label className={styles.formLabel}>
                      Descripción del módulo
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Descripción del módulo"
                      value={currentModule.description}
                      onChange={(e) => setCurrentModule(prev => ({ ...prev, description: e.target.value }))}
                      className={styles.formControl}
                    />
                  </Form.Group>
                </Col>
                <Col md={2} className="d-flex align-items-end">
                  <Button
                    variant="primary"
                    onClick={handleAddModule}
                    disabled={!currentModule.nombre.trim() || loading}
                    className={`${styles.addButton} w-100`}
                    title="Agregar módulo a la lista"
                  >
                    <Plus size={16} className="me-2" />
                    Agregar
                  </Button>
                </Col>
              </Row>

              {allModules.length > 0 && (
                <div className={styles.modulesTable}>
                  <Table responsive className="mb-0">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombre del módulo</th>
                        <th>Descripción del módulo</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allModules.map((module) => {
                        // Validar que el módulo tenga los datos necesarios
                        if (!module || !module.id) {
                          console.warn('Módulo inválido encontrado:', module);
                          return null;
                        }
                        
                        return (
                          <tr key={module.id}>
                            <td>
                              <small className="text-muted font-monospace">
                                {module.id}
                              </small>
                            </td>
                            <td>
                              {module.nombre || 'Sin nombre'}
                              {module.isExisting && (
                                <span className="badge bg-secondary ms-2">Existente</span>
                              )}
                              {!module.isExisting && (
                                <span className="badge bg-success ms-2">Nuevo</span>
                              )}
                            </td>
                            <td>{module.description || 'Sin descripción'}</td>
                            <td>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => {
                                  console.log('=== CLICK ELIMINAR ==='); // Debug log
                                  console.log('Módulo completo:', module); // Debug log
                                  console.log('ID del módulo:', module.id); // Debug log
                                  console.log('Es existente:', module.isExisting); // Debug log
                                  console.log('PageId actual:', pageId); // Debug log
                                  
                                  if (module.isExisting) {
                                    handleRemoveExistingModule(module.id);
                                  } else {
                                    handleRemoveNewModule(module.id);
                                  }
                                }}
                                disabled={deletingModules.has(module.id)}
                                title={`Eliminar módulo: ${module.nombre} (ID: ${module.id})`}
                              >
                                {deletingModules.has(module.id) ? (
                                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                              </Button>
                            </td>
                          </tr>
                        );
                      }).filter(Boolean)} 
                    </tbody>
                  </Table>
                </div>
              )}

              {/* Información de debug */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-3">
                  <details className="mb-3">
                    <summary className="text-muted">Debug Info</summary>
                    <div className="mt-2">
                      <pre className="small text-muted">
                        {JSON.stringify({
                          pageId,
                          existingModulesCount: existingModules.length,
                          newModulesCount: newModules.length,
                          deletingModules: Array.from(deletingModules),
                          allModulesIds: allModules.map(m => m.id)
                        }, null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
              )}
            </div>
          </Form>
        )}
      </Modal.Body>

      <Modal.Footer className={`${styles.modalFooter} border-0`}>
        <Button 
          variant="secondary" 
          onClick={handleClose}
          className={styles.cancelButton}
        >
          Cerrar
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={loading || loadingPage}
          className={styles.saveButton}
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditPageModal;