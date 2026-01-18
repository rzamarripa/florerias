"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Edit, Trash2, Package, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { productsService } from "./services/products";
import { Product } from "./types";

interface ProductDetailsPageProps {
  productId: string;
}

const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({
  productId,
}) => {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [stats, setStats] = useState<{ orderCount: number; totalQuantitySold: number; totalRevenue: number } | null>(null);

  useEffect(() => {
    loadProduct();
    loadStats();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await productsService.getProductById(productId);
      setProduct(response.data);
      if (response.data.imagen) {
        setSelectedImage(response.data.imagen);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar el producto");
      router.push("/catalogos/productos");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await productsService.getProductStats(productId);
      setStats(response.data);
    } catch (error: any) {
      console.error("Error al cargar estadisticas:", error);
    }
  };

  const handleEdit = () => {
    router.push(`/catalogos/productos/${productId}`);
  };

  const handleDelete = async () => {
    if (window.confirm("Estas seguro de eliminar este producto?")) {
      try {
        await productsService.deleteProduct(productId);
        toast.success("Producto eliminado exitosamente");
        router.push("/catalogos/productos");
      } catch (error: any) {
        toast.error(error.message || "Error al eliminar el producto");
      }
    }
  };

  const handleBack = () => {
    router.push("/catalogos/productos");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const totalCosto =
    product.insumos?.reduce(
      (sum, insumo) => sum + (insumo.importeCosto || 0),
      0
    ) || 0;
  const totalVenta =
    product.insumos?.reduce(
      (sum, insumo) => sum + (insumo.importeVenta || 0),
      0
    ) || 0;
  const discount =
    totalCosto > 0
      ? Math.round(((totalCosto - totalVenta) / totalCosto) * 100)
      : 0;

  return (
    <div className="product-details-page">
      {/* Back Button */}
      <Button
        variant="link"
        onClick={handleBack}
        className="mb-3 no-underline flex items-center gap-2 p-0"
      >
        <ArrowLeft size={18} />
        Volver a productos
      </Button>

      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Product Images */}
            <div className="lg:col-span-5">
              <div className="mb-3">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={product.nombre}
                    className="w-full rounded-lg border object-cover"
                    style={{ height: "400px" }}
                  />
                ) : (
                  <div
                    className="w-full rounded-lg border bg-muted flex items-center justify-center"
                    style={{ height: "400px" }}
                  >
                    <Package size={80} className="text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Thumbnail (single image) */}
              {product.imagen && (
                <div className="flex gap-2">
                  <img
                    src={product.imagen}
                    alt={product.nombre}
                    className="rounded-lg border cursor-pointer"
                    style={{
                      width: "80px",
                      height: "80px",
                      objectFit: "cover",
                      opacity: selectedImage === product.imagen ? 1 : 0.6,
                    }}
                    onClick={() => setSelectedImage(product.imagen)}
                  />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="lg:col-span-7">
              {/* Stock Badge */}
              <Badge
                variant={product.estatus ? "default" : "destructive"}
                className={`mb-3 ${product.estatus ? "bg-green-500 hover:bg-green-600" : ""}`}
              >
                {product.estatus ? "In Stock" : "Out of Stock"}
              </Badge>

              {/* Product Title */}
              <h2 className="text-2xl font-bold mb-3">{product.nombre}</h2>

              {/* Product Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="mb-3">
                  <div className="text-muted-foreground text-sm">UUID:</div>
                  <div className="font-semibold">
                    {product._id}
                  </div>
                </div>
                <div className="mb-3">
                  <div className="text-muted-foreground text-sm">UNIDAD DE MEDIDA:</div>
                  <div className="font-semibold">{product.unidad}</div>
                </div>
                <div className="mb-3">
                  <div className="text-muted-foreground text-sm">STOCK:</div>
                  <div className="font-semibold">
                    {product.insumos?.length || 0}
                  </div>
                </div>
                <div className="mb-3">
                  <div className="text-muted-foreground text-sm">PUBLISHED:</div>
                  <div className="font-semibold">
                    {new Date(product.createdAt).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    {new Date(product.createdAt).toLocaleTimeString("es-MX", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </div>
                </div>
                <div className="mb-3">
                  <div className="text-muted-foreground text-sm">VENTAS:</div>
                  <div className="font-semibold">
                    {stats?.orderCount || 0} ordenes ({stats?.totalQuantitySold || 0} unidades)
                  </div>
                </div>
                <div className="mb-3">
                  <div className="text-muted-foreground text-sm">INGRESOS:</div>
                  <div className="font-semibold">
                    $
                    {(stats?.totalRevenue || 0).toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-red-500 font-bold text-3xl">
                    ${totalVenta.toFixed(2)}
                  </span>
                  {discount > 0 && (
                    <Badge variant="destructive" className="text-base">
                      {discount}%
                    </Badge>
                  )}
                </div>
              </div>

              {/* Product Info Section */}
              {product.descripcion && (
                <div className="mb-4">
                  <h5 className="font-bold mb-3">PRODUCT INFO:</h5>
                  <p className="text-muted-foreground">{product.descripcion}</p>
                </div>
              )}

              {/* Insumos Section */}
              {product.insumos && product.insumos.length > 0 && (
                <div className="mb-4">
                  <h5 className="font-bold mb-3">INSUMOS:</h5>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Unidad</TableHead>
                          <TableHead>Costo</TableHead>
                          <TableHead>Venta</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {product.insumos.map((insumo, index) => (
                          <TableRow key={index}>
                            <TableCell>{insumo.nombre}</TableCell>
                            <TableCell>{insumo.cantidad}</TableCell>
                            <TableCell>{insumo.unidad}</TableCell>
                            <TableCell className="text-green-600">
                              ${insumo.importeCosto.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-primary">
                              ${insumo.importeVenta.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  className="flex items-center gap-2"
                  onClick={handleEdit}
                >
                  <Edit size={18} />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  className="flex items-center gap-2"
                  onClick={handleDelete}
                >
                  <Trash2 size={18} />
                  Delisting
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductDetailsPage;
