import React from 'react';
import { Form, Row, Col, Accordion } from 'react-bootstrap';
import { TbPhoto, TbUpload } from 'react-icons/tb';
import { toast } from 'react-toastify';

interface BannerSectionProps {
  bannerEnabled: boolean;
  setBannerEnabled: (value: boolean) => void;
  bannerTitle: string;
  setBannerTitle: (value: string) => void;
  bannerText: string;
  setBannerText: (value: string) => void;
  bannerUrl: string;
  bannerFile: File | null;
  setBannerFile: (file: File | null) => void;
  bannerButtonName: string;
  setBannerButtonName: (value: string) => void;
  bannerButtonLink: string;
  setBannerButtonLink: (value: string) => void;
}

const BannerSection: React.FC<BannerSectionProps> = ({
  bannerEnabled,
  setBannerEnabled,
  bannerTitle,
  setBannerTitle,
  bannerText,
  setBannerText,
  bannerUrl,
  bannerFile,
  setBannerFile,
  bannerButtonName,
  setBannerButtonName,
  bannerButtonLink,
  setBannerButtonLink,
}) => {
  return (
    <Accordion.Item eventKey="banner" className="mb-3 border-0 shadow-sm rounded overflow-hidden">
      <Accordion.Header className="bg-light">
        <div className="d-flex align-items-center w-100">
          <TbPhoto size={20} className="text-primary me-2" />
          <span className="fw-semibold fs-6">Banner Principal</span>
          <Form.Check 
            type="switch"
            id="banner-switch"
            checked={bannerEnabled}
            onChange={(e) => setBannerEnabled(e.target.checked)}
            className="ms-auto me-2"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </Accordion.Header>
      <Accordion.Body className="bg-white">
        {bannerEnabled ? (
          <div>
            <Row className="g-2 mb-2">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-medium">Título</Form.Label>
                  <Form.Control 
                    size="sm"
                    type="text" 
                    placeholder="Ofertas especiales"
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    maxLength={100}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-medium">Descripción</Form.Label>
                  <Form.Control 
                    size="sm"
                    type="text" 
                    placeholder="Descuentos de hasta 50%"
                    value={bannerText}
                    onChange={(e) => setBannerText(e.target.value)}
                    maxLength={300}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="g-2 mb-2">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-medium">Texto del botón</Form.Label>
                  <Form.Control 
                    size="sm"
                    type="text" 
                    placeholder="Ver más"
                    value={bannerButtonName}
                    onChange={(e) => setBannerButtonName(e.target.value)}
                    maxLength={50}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-medium">Enlace</Form.Label>
                  <Form.Control 
                    size="sm"
                    type="text" 
                    placeholder="/productos"
                    value={bannerButtonLink}
                    onChange={(e) => setBannerButtonLink(e.target.value)}
                    maxLength={200}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group>
              <Form.Label className="small fw-medium">Imagen</Form.Label>
              <div className="border rounded p-2 bg-light">
                {bannerUrl && (
                  <img 
                    src={bannerUrl} 
                    alt="Banner" 
                    style={{ maxWidth: "100%", maxHeight: "100px" }}
                    className="mb-2 rounded"
                  />
                )}
                <div>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const file = e.target.files?.[0];
                      if (file && file.size <= 5 * 1024 * 1024) {
                        setBannerFile(file);
                      } else {
                        toast.error("El archivo debe ser menor a 5MB");
                      }
                    }}
                    className="d-none"
                    id="banner-upload"
                  />
                  <label htmlFor="banner-upload" className="btn btn-outline-primary btn-sm">
                    <TbUpload className="me-1" size={14} />
                    Subir imagen
                  </label>
                  {bannerFile && (
                    <span className="text-success small ms-2">
                      {bannerFile.name}
                    </span>
                  )}
                </div>
              </div>
            </Form.Group>
          </div>
        ) : (
          <p className="text-muted text-center my-3">Banner deshabilitado</p>
        )}
      </Accordion.Body>
    </Accordion.Item>
  );
};

export default BannerSection;