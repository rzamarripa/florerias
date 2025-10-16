import React from "react";
import { Modal, Button, Table, Badge } from "react-bootstrap";
import { X, List } from "lucide-react";
import { Product } from "../../products/types";
import { Material } from "../../materials/types";

interface DesgloseModalProps {
  show: boolean;
  onHide: () => void;
  product: (Product & { cantidad: number }) | null;
  materials: Material[];
}

const DesgloseModal: React.FC<DesgloseModalProps> = ({ show, onHide, product, materials }) => {
  const calculateLotes = (product: Product & { cantidad: number }) => {
    let totalLotes = 0;
    product.insumos.forEach(insumo => {
      const material = materials.find(m => m._id === insumo.materialId);
      if (material && material.piecesPerPackage > 0) {
        const lotes = (insumo.cantidad * product.cantidad) / material.piecesPerPackage;
        totalLotes += lotes;
      }
    });
    return totalLotes;
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <List size={20} className="me-2" />
          Desglose de Insumos - {product?.nombre}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {product && (
          <>
            <div className="mb-3">
              <strong>Producto:</strong> {product.nombre}<br />
              <strong>Cantidad del producto:</strong> {product.cantidad}
            </div>
            <Table className="table table-sm table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Insumo</th>
                  <th className="text-center">Cantidad por Producto</th>
                  <th className="text-center">Unidad</th>
                  <th className="text-center">Cantidad Total</th>
                  <th className="text-center">Piezas por Paquete</th>
                  <th className="text-center">Lotes Requeridos</th>
                </tr>
              </thead>
              <tbody>
                {product.insumos.map((insumo, index) => {
                  const material = materials.find(m => m._id === insumo.materialId);
                  const piecesPerPackage = material?.piecesPerPackage || 1;
                  const cantidadTotal = insumo.cantidad * product.cantidad;
                  const lotesRequeridos = cantidadTotal / piecesPerPackage;

                  return (
                    <tr key={index}>
                      <td>{insumo.nombre}</td>
                      <td className="text-center">{insumo.cantidad}</td>
                      <td className="text-center">{insumo.unidad}</td>
                      <td className="text-center fw-bold text-primary">{cantidadTotal}</td>
                      <td className="text-center">{piecesPerPackage}</td>
                      <td className="text-center">
                        <Badge bg="info">{lotesRequeridos.toFixed(2)}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="table-light fw-bold">
                <tr>
                  <td colSpan={5} className="text-end">Total de Lotes:</td>
                  <td className="text-center">
                    <Badge bg="success" className="fs-6">
                      {calculateLotes(product).toFixed(2)}
                    </Badge>
                  </td>
                </tr>
              </tfoot>
            </Table>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          <X size={16} className="me-1" />
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DesgloseModal;
