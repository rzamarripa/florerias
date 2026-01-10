import React from 'react';
import { Form, Row, Col, Button, Accordion } from 'react-bootstrap';
import { TbPhoto, TbUpload, TbTrash } from 'react-icons/tb';
import { toast } from 'react-toastify';

interface CarouselImage {
  url: string;
  path: string;
}

interface CarouselSectionProps {
  carouselEnabled: boolean;
  setCarouselEnabled: (value: boolean) => void;
  carouselImages: CarouselImage[];
  carouselFiles: File[];
  setCarouselFiles: (files: File[]) => void;
  removeCarouselImage: (index: number) => void;
}

const CarouselSection: React.FC<CarouselSectionProps> = ({
  carouselEnabled,
  setCarouselEnabled,
  carouselImages,
  carouselFiles,
  setCarouselFiles,
  removeCarouselImage,
}) => {
  return (
    <Accordion.Item eventKey="carousel" className="mb-3 border-0 shadow-sm rounded overflow-hidden">
      <Accordion.Header className="bg-light">
        <div className="d-flex align-items-center w-100">
          <TbPhoto size={20} className="text-info me-2" />
          <span className="fw-semibold fs-6">Carrusel de Imágenes</span>
          <Form.Check 
            type="switch"
            id="carousel-switch"
            checked={carouselEnabled}
            onChange={(e) => setCarouselEnabled(e.target.checked)}
            className="ms-auto me-2"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </Accordion.Header>
      <Accordion.Body className="bg-white">
        {carouselEnabled ? (
          <div>
            <Row className="g-2">
              {/* Imágenes existentes */}
              {carouselImages.map((image, index) => (
                <Col key={`existing-${index}`} xs={6} md={3} lg={2}>
                  <div className="position-relative">
                    <img 
                      src={image.url} 
                      alt={`Imagen ${index + 1}`}
                      className="img-fluid rounded"
                      style={{ height: "80px", width: "100%", objectFit: "cover" }}
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      className="position-absolute top-0 end-0 m-1 p-1"
                      onClick={() => removeCarouselImage(index)}
                    >
                      <TbTrash size={12} />
                    </Button>
                  </div>
                </Col>
              ))}
              
              {/* Archivos pendientes */}
              {carouselFiles.map((file, index) => (
                <Col key={`pending-${index}`} xs={6} md={3} lg={2}>
                  <div className="position-relative">
                    <div 
                      className="bg-secondary bg-opacity-10 rounded d-flex flex-column align-items-center justify-content-center"
                      style={{ height: "80px", width: "100%" }}
                    >
                      <TbUpload size={20} className="text-muted" />
                      <small className="text-truncate px-1" style={{ maxWidth: "90%", fontSize: "10px" }}>
                        {file.name}
                      </small>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      className="position-absolute top-0 end-0 m-1 p-1"
                      onClick={() => {
                        const newFiles = carouselFiles.filter((_, i) => i !== index);
                        setCarouselFiles(newFiles);
                      }}
                    >
                      <TbTrash size={12} />
                    </Button>
                  </div>
                </Col>
              ))}
            </Row>
            
            {(carouselImages.length + carouselFiles.length) < 5 && (
              <div className="mt-3">
                <Form.Control
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const files = Array.from(e.target.files || []);
                    const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024);
                    const remainingSlots = 5 - carouselImages.length - carouselFiles.length;
                    const filesToAdd = validFiles.slice(0, remainingSlots);
                    
                    if (validFiles.length !== files.length) {
                      toast.error("Algunos archivos exceden 5MB");
                    }
                    
                    if (filesToAdd.length > 0) {
                      setCarouselFiles([...carouselFiles, ...filesToAdd]);
                    }
                    
                    if (filesToAdd.length < validFiles.length) {
                      toast.warning(`Solo se agregaron ${filesToAdd.length} imágenes. Máximo 5.`);
                    }
                  }}
                  className="d-none"
                  id="carousel-upload"
                />
                <label htmlFor="carousel-upload" className="btn btn-outline-primary btn-sm">
                  <TbUpload className="me-1" size={14} />
                  Agregar imágenes
                </label>
                <span className="ms-2 text-muted small">
                  {5 - carouselImages.length - carouselFiles.length} espacios disponibles
                </span>
              </div>
            )}
            
            <p className="text-muted small mt-2 mb-0">
              Máximo 5 imágenes. Tamaño recomendado: 800x600px
            </p>
          </div>
        ) : (
          <p className="text-muted text-center my-3">Carrusel deshabilitado</p>
        )}
      </Accordion.Body>
    </Accordion.Item>
  );
};

export default CarouselSection;