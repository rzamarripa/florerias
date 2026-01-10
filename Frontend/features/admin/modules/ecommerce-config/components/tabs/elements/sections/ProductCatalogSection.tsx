import React from 'react';
import { Form, Row, Col, Accordion } from 'react-bootstrap';
import { TbShoppingBag, TbLayoutGrid, TbLayoutList, TbFilter } from 'react-icons/tb';

interface ProductCatalogSectionProps {
  catalogEnabled: boolean;
  setCatalogEnabled: (value: boolean) => void;
  catalogDisplay: string;
  setCatalogDisplay: (value: string) => void;
  catalogProductsPerPage: number;
  setCatalogProductsPerPage: (value: number) => void;
  catalogShowFilters: boolean;
  setCatalogShowFilters: (value: boolean) => void;
  catalogShowCategories: boolean;
  setCatalogShowCategories: (value: boolean) => void;
  catalogShowSearch: boolean;
  setCatalogShowSearch: (value: boolean) => void;
  catalogShowSort: boolean;
  setCatalogShowSort: (value: boolean) => void;
}

const ProductCatalogSection: React.FC<ProductCatalogSectionProps> = ({
  catalogEnabled,
  setCatalogEnabled,
  catalogDisplay,
  setCatalogDisplay,
  catalogProductsPerPage,
  setCatalogProductsPerPage,
  catalogShowFilters,
  setCatalogShowFilters,
  catalogShowCategories,
  setCatalogShowCategories,
  catalogShowSearch,
  setCatalogShowSearch,
  catalogShowSort,
  setCatalogShowSort,
}) => {
  return (
    <Accordion.Item eventKey="catalog" className="mb-3 border-0 shadow-sm rounded overflow-hidden">
      <Accordion.Header className="bg-light">
        <div className="d-flex align-items-center w-100">
          <TbShoppingBag size={20} className="text-purple me-2" style={{ color: '#6f42c1' }} />
          <span className="fw-semibold fs-6">Catálogo de Productos</span>
          <Form.Check 
            type="switch"
            id="catalog-switch"
            checked={catalogEnabled}
            onChange={(e) => setCatalogEnabled(e.target.checked)}
            className="ms-auto me-2"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </Accordion.Header>
      <Accordion.Body className="bg-white">
        {catalogEnabled ? (
          <div>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-medium">
                    <TbLayoutGrid size={14} className="me-1" />
                    Tipo de visualización
                  </Form.Label>
                  <Form.Select 
                    size="sm"
                    value={catalogDisplay}
                    onChange={(e) => setCatalogDisplay(e.target.value)}
                  >
                    <option value="grid">Cuadrícula</option>
                    <option value="list">Lista</option>
                    <option value="cards">Tarjetas</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-medium">Productos por página</Form.Label>
                  <Form.Select 
                    size="sm"
                    value={catalogProductsPerPage}
                    onChange={(e) => setCatalogProductsPerPage(Number(e.target.value))}
                  >
                    <option value="6">6 productos</option>
                    <option value="9">9 productos</option>
                    <option value="12">12 productos</option>
                    <option value="15">15 productos</option>
                    <option value="20">20 productos</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <div className="mt-3">
              <Form.Label className="small fw-medium mb-2">
                <TbFilter size={14} className="me-1" />
                Opciones de navegación
              </Form.Label>
              <div className="bg-light rounded p-3">
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Check
                      type="switch"
                      id="show-filters"
                      label="Mostrar filtros laterales"
                      checked={catalogShowFilters}
                      onChange={(e) => setCatalogShowFilters(e.target.checked)}
                      className="mb-2"
                    />
                    <Form.Check
                      type="switch"
                      id="show-categories"
                      label="Mostrar categorías"
                      checked={catalogShowCategories}
                      onChange={(e) => setCatalogShowCategories(e.target.checked)}
                      className="mb-2"
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Check
                      type="switch"
                      id="show-search"
                      label="Mostrar barra de búsqueda"
                      checked={catalogShowSearch}
                      onChange={(e) => setCatalogShowSearch(e.target.checked)}
                      className="mb-2"
                    />
                    <Form.Check
                      type="switch"
                      id="show-sort"
                      label="Mostrar opciones de ordenamiento"
                      checked={catalogShowSort}
                      onChange={(e) => setCatalogShowSort(e.target.checked)}
                      className="mb-2"
                    />
                  </Col>
                </Row>
              </div>
            </div>

            <div className="mt-3">
              <div className="border rounded p-3 bg-white">
                <h6 className="mb-2">Vista previa del diseño</h6>
                <div className="d-flex align-items-center text-muted small">
                  {catalogDisplay === 'grid' && <TbLayoutGrid size={16} className="me-2" />}
                  {catalogDisplay === 'list' && <TbLayoutList size={16} className="me-2" />}
                  {catalogDisplay === 'cards' && <TbLayoutGrid size={16} className="me-2" />}
                  <span>
                    {catalogDisplay === 'grid' && 'Los productos se mostrarán en una cuadrícula de 3-4 columnas'}
                    {catalogDisplay === 'list' && 'Los productos se mostrarán en una lista vertical con detalles'}
                    {catalogDisplay === 'cards' && 'Los productos se mostrarán como tarjetas grandes con información completa'}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-muted small mt-2 mb-0">
              El catálogo mostrará todos los productos activos con stock disponible
            </p>
          </div>
        ) : (
          <p className="text-muted text-center my-3">Catálogo de productos deshabilitado</p>
        )}
      </Accordion.Body>
    </Accordion.Item>
  );
};

export default ProductCatalogSection;