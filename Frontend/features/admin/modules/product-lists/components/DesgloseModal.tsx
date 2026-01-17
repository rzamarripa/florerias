import React from "react";
import { X, List } from "lucide-react";
import { Product } from "../../products/types";
import { Material } from "../../materials/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";

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
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <List size={20} />
            Desglose de Insumos - {product?.nombre}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {product && (
            <>
              <div className="mb-3">
                <strong>Producto:</strong> {product.nombre}<br />
                <strong>Cantidad del producto:</strong> {product.cantidad}
              </div>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Insumo</TableHead>
                      <TableHead className="text-center">Cantidad por Producto</TableHead>
                      <TableHead className="text-center">Unidad</TableHead>
                      <TableHead className="text-center">Cantidad Total</TableHead>
                      <TableHead className="text-center">Piezas por Paquete</TableHead>
                      <TableHead className="text-center">Lotes Requeridos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.insumos.map((insumo, index) => {
                      const material = materials.find(m => m._id === insumo.materialId);
                      const piecesPerPackage = material?.piecesPerPackage || 1;
                      const cantidadTotal = insumo.cantidad * product.cantidad;
                      const lotesRequeridos = cantidadTotal / piecesPerPackage;

                      return (
                        <TableRow key={index}>
                          <TableCell>{insumo.nombre}</TableCell>
                          <TableCell className="text-center">{insumo.cantidad}</TableCell>
                          <TableCell className="text-center">{insumo.unidad}</TableCell>
                          <TableCell className="text-center font-bold text-primary">{cantidadTotal}</TableCell>
                          <TableCell className="text-center">{piecesPerPackage}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="bg-cyan-500 text-white">
                              {lotesRequeridos.toFixed(2)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter className="bg-muted/50 font-bold">
                    <TableRow>
                      <TableCell colSpan={5} className="text-right">Total de Lotes:</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-600 text-white text-base">
                          {calculateLotes(product).toFixed(2)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onHide}>
            <X size={16} className="mr-1" />
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DesgloseModal;
