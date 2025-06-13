import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col, Table } from 'react-bootstrap';
import { X, Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { pagesService, CreatePageData } from '../../services/pages';
import { modulesService, CreateModuleData } from '../../services/modules';
import styles from './addpage.module.css';
import { CreatePageFormData, createPageSchema, ModuleRow } from '../../schemas';



interface CreatePageModalProps {
  show: boolean;
  onHide: () => void;
  onPageCreated: () => void;
}


const CreatePageModal: React.FC<CreatePageModalProps> = ({ show, onHide, onPageCreated }) => {
  const [formData, setFormData] = useState<CreatePageFormData>({
    name: '',
    path: '',
    description: '',
    modules: []
  });
  
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [currentModule, setCurrentModule] = useState({ nombre: '', description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof CreatePageFormData, value: string) => {
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
        id: Date.now().toString(),
        nombre: currentModule.nombre.trim(),
        description: currentModule.description.trim()
      };
      
      setModules(prev => [...prev, newModule]);
      setCurrentModule({ nombre: '', description: '' });
    }
  };

  const handleRemoveModule = (id: string) => {
    setModules(prev => prev.filter(module => module.id !== id));
  };

  const validateForm = (): boolean => {
    try {
      createPageSchema.parse(formData);
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
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // 1. Crear la página SIN módulos
      const pageData: CreatePageData = {
        name: formData.name,
        path: formData.path,
        description: formData.description || undefined
        // NO enviamos módulos aquí
      };

      const pageResponse = await pagesService.createPage(pageData);
      
      if (!pageResponse.success || !pageResponse.data) {
        throw new Error('Error al crear la página');
      }

      const createdPageId = pageResponse.data._id;

      if (modules.length > 0) {
        const moduleIds: string[] = [];
        
        for (const mod of modules) {
          const moduleData: CreateModuleData = {
            name: mod.nombre,
            description: mod.description,
            page: createdPageId
          };

          const moduleResponse = await modulesService.createModule(moduleData);
          
          if (moduleResponse.success && moduleResponse.data) {
            moduleIds.push(moduleResponse.data._id);
          }
        }

        // Esto depende de si tu backend maneja automáticamente la relación
        // Por ahora lo omito ya que el Module ya tiene referencia a Page
      }
      
      // Resetear formulario
      setFormData({ name: '', path: '', description: '', modules: [] });
      setModules([]);
      setCurrentModule({ nombre: '', description: '' });
      setErrors({});
      
      onPageCreated();
      onHide();
    } catch (error) {
      console.error('Error creating page:', error);
      setErrors({ general: error instanceof Error ? error.message : 'Error al crear la página' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', path: '', description: '', modules: [] });
    setModules([]);
    setCurrentModule({ nombre: '', description: '' });
    setErrors({});
    onHide();
  };

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
          Crear nueva página
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
                  disabled={!currentModule.nombre.trim()}
                  className={styles.addButton}
                >
                  <Plus size={16} className="me-2" />
                  Agregar
                </Button>
              </Col>
            </Row>

            {modules.length > 0 && (
              <div className={styles.modulesTable}>
                <Table responsive className="mb-0">
                  <thead>
                    <tr>
                      <th>Nombre del módulo</th>
                      <th>Descripción del módulo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((module) => (
                      <tr key={module.id}>
                        <td>{module.nombre}</td>
                        <td>{module.description}</td>
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleRemoveModule(module.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </div>
        </Form>
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
          disabled={loading}
          className={styles.saveButton}
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreatePageModal;