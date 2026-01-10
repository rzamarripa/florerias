import React from 'react';
import { Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import { TbUpload, TbPlus, TbTrash } from 'react-icons/tb';
import { toast } from 'react-toastify';
import type { TopbarItem } from '../../types';

interface HeaderTabProps {
  pageTitle: string;
  setPageTitle: (value: string) => void;
  logoUrl: string;
  logoFile: File | null;
  setLogoFile: (file: File | null) => void;
  topbarItems: TopbarItem[];
  setTopbarItems: (items: TopbarItem[]) => void;
  saving: boolean;
  onSave: () => void;
}

const HeaderTab: React.FC<HeaderTabProps> = ({
  pageTitle,
  setPageTitle,
  logoUrl,
  logoFile,
  setLogoFile,
  topbarItems,
  setTopbarItems,
  saving,
  onSave,
}) => {
  const addTopbarItem = () => {
    const newItem: TopbarItem = {
      name: "",
      link: "",
      order: topbarItems.length
    };
    setTopbarItems([...topbarItems, newItem]);
  };

  const updateTopbarItem = (index: number, field: keyof TopbarItem, value: string | number) => {
    const updated = [...topbarItems];
    updated[index] = { ...updated[index], [field]: value };
    setTopbarItems(updated);
  };

  const removeTopbarItem = (index: number) => {
    setTopbarItems(topbarItems.filter((_, i) => i !== index));
  };

  return (
    <div>
      <h5 className="mb-4">Configuración del encabezado</h5>
      <Form>
        {/* Título de página */}
        <Row className="g-3 mb-4">
          <Col md={6}>
            <Form.Group>
              <Form.Label className="fw-medium">
                Título de la página <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                placeholder="Ej: Mi tienda online"
                maxLength={100}
              />
              <Form.Text className="text-muted">
                {pageTitle.length}/100 caracteres
              </Form.Text>
            </Form.Group>
          </Col>

          {/* Logo */}
          <Col md={6}>
            <Form.Group>
              <Form.Label className="fw-medium">
                Logo del negocio <span className="text-danger">*</span>
              </Form.Label>
              <div className="border rounded p-3 text-center bg-light">
                {logoUrl ? (
                  <div className="mb-2">
                    <img 
                      src={logoUrl} 
                      alt="Logo" 
                      style={{ maxWidth: "150px", maxHeight: "100px" }}
                    />
                  </div>
                ) : (
                  <div className="mb-2">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                )}
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0];
                    if (file && file.size <= 5 * 1024 * 1024) {
                      setLogoFile(file);
                    } else {
                      toast.error("El archivo debe ser menor a 5MB");
                    }
                  }}
                  className="d-none"
                  id="logo-upload"
                />
                <label htmlFor="logo-upload" className="btn btn-outline-primary btn-sm">
                  <TbUpload className="me-1" />
                  Subir logo
                </label>
                {logoFile && (
                  <p className="text-success small mt-2 mb-0">
                    Archivo seleccionado: {logoFile.name}
                  </p>
                )}
                <p className="text-muted small mt-2 mb-0">
                  Tamaño recomendado: 400x400px. Máximo: 5MB
                </p>
              </div>
            </Form.Group>
          </Col>
        </Row>

        {/* Topbar */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Label className="fw-medium mb-0">
              Menú de navegación (Topbar)
            </Form.Label>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={addTopbarItem}
              disabled={topbarItems.length >= 6}
            >
              <TbPlus className="me-1" />
              Agregar opción
            </Button>
          </div>
          
          {topbarItems.length === 0 ? (
            <div className="text-center py-4 bg-light rounded">
              <p className="text-muted mb-0">
                No hay opciones en el menú. Haz clic en "Agregar opción" para crear una.
              </p>
            </div>
          ) : (
            <div className="border rounded p-3">
              {topbarItems.map((item, index) => (
                <Row key={index} className="g-2 mb-2 align-items-center">
                  <Col md={5}>
                    <Form.Control
                      type="text"
                      placeholder="Nombre del enlace"
                      value={item.name}
                      onChange={(e) => updateTopbarItem(index, 'name', e.target.value)}
                      maxLength={50}
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Control
                      type="text"
                      placeholder="URL (ej: /productos)"
                      value={item.link}
                      onChange={(e) => updateTopbarItem(index, 'link', e.target.value)}
                      maxLength={200}
                    />
                  </Col>
                  <Col md={1}>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeTopbarItem(index)}
                    >
                      <TbTrash size={16} />
                    </Button>
                  </Col>
                </Row>
              ))}
              {topbarItems.length >= 6 && (
                <p className="text-warning small mb-0 mt-2">
                  Máximo 6 opciones en el menú
                </p>
              )}
            </div>
          )}
        </div>

        <div className="d-flex justify-content-end mt-4">
          <Button 
            variant="primary"
            onClick={onSave}
            disabled={saving || !pageTitle}
          >
            {saving ? <Spinner animation="border" size="sm" className="me-2" /> : null}
            Guardar cambios
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default HeaderTab;