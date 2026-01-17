"use client";

import React, { useState, useEffect } from "react";
import { Package, Plus, Trash2, Save, ArrowLeft, List, Loader2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import { productListsService } from "./services/productLists";
import { CreateProductListData } from "./types";
import { productsService } from "../products/services/products";
import { Product } from "../products/types";
import { companiesService } from "../companies/services/companies";
import { materialsService } from "../materials/services/materials";
import { Material } from "../materials/types";
import DesgloseModal from "./components/DesgloseModal";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { branchesService } from "../branches/services/branches";
import { Branch } from "../branches/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

const NewProductListPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const productListId = params?.id as string;
  const isEditing = !!productListId;
  const { activeBranch } = useActiveBranchStore();
  const { hasRole } = useUserRoleStore();
  const isManager = hasRole("Gerente");
  const isAdmin = hasRole("Administrador") || hasRole("Admin");

  const [formData, setFormData] = useState<CreateProductListData>({
    name: "",
    products: [],
    company: "",
    branch: "",
    expirationDate: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<
    (Product & { cantidad: number })[]
  >([]);
  const [userCompany, setUserCompany] = useState<any>(null);
  const [currentProductId, setCurrentProductId] = useState<string>("");
  const [currentQuantity, setCurrentQuantity] = useState<number>(1);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showDesglose, setShowDesglose] = useState(false);
  const [desgloseProduct, setDesgloseProduct] = useState<
    (Product & { cantidad: number }) | null
  >(null);
  const [managerBranch, setManagerBranch] = useState<Branch | null>(null);

  // Funcion para formatear numeros con separacion de miles
  const formatNumber = (num: number): string => {
    return num.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Cargar productos disponibles y establecer sucursal activa
  useEffect(() => {
    loadProducts();
    loadUserCompany();
    loadMaterials();

    // Si es gerente, cargar su sucursal asignada
    if (isManager) {
      loadManagerBranch();
    } else if (isAdmin && activeBranch) {
      // Si es admin, usar la sucursal activa del store
      setFormData((prev) => ({ ...prev, branch: activeBranch._id }));
    }
  }, [isManager, isAdmin, activeBranch]);

  // Cargar lista de productos si estamos editando
  useEffect(() => {
    if (isEditing) {
      loadProductList();
    }
  }, [productListId]);

  const loadProducts = async () => {
    try {
      const response = await productsService.getAllProducts({
        limit: 1000,
        estatus: true,
      });
      setAvailableProducts(response.data);
    } catch (err: any) {
      toast.error(err.message || "Error al cargar los productos");
    }
  };

  const loadMaterials = async () => {
    try {
      const response = await materialsService.getAllMaterials({
        status: true,
        limit: 1000,
      });
      setMaterials(response.data);
    } catch (err: any) {
      console.error("Error al cargar materiales:", err);
    }
  };

  const loadUserCompany = async () => {
    try {
      // Usar el nuevo endpoint que soporta tanto Administrador como Gerente
      const response = await companiesService.getUserCompany();

      if (response.success && response.data) {
        setUserCompany(response.data);
        setFormData((prev) => ({ ...prev, company: response.data._id }));
      }
    } catch (err: any) {
      console.error("Error al cargar empresa del usuario:", err);
      // No mostrar error al usuario si es Super Admin u otro rol que no tiene empresa asignada
      if (!err.message?.includes("no tiene una empresa asignada")) {
        toast.error(err.message || "Error al cargar la empresa del usuario");
      }
    }
  };

  const loadManagerBranch = async () => {
    try {
      // Obtener las sucursales del gerente (deberia ser solo una)
      const response = await branchesService.getUserBranches();

      if (response.success && response.data && response.data.length > 0) {
        const branch = response.data[0]; // El gerente solo debe tener una sucursal
        setManagerBranch(branch);
        setFormData((prev) => ({ ...prev, branch: branch._id }));
        console.log("🔍 [ProductList] Sucursal del gerente cargada:", branch.branchName);
      } else {
        toast.error("No se encontro una sucursal asignada para el gerente");
      }
    } catch (err: any) {
      console.error("Error al cargar sucursal del gerente:", err);
      toast.error(err.message || "Error al cargar la sucursal del gerente");
    }
  };

  const loadProductList = async () => {
    try {
      setLoading(true);
      const response = await productListsService.getProductListById(
        productListId
      );
      const productList = response.data;

      setFormData({
        name: productList.name,
        products: productList.products.map((p) => ({
          productId: p.productId,
          cantidad: p.cantidad,
        })),
        company:
          typeof productList.company === "string"
            ? productList.company
            : productList.company._id,
        branch:
          typeof productList.branch === "string"
            ? productList.branch
            : productList.branch._id,
        expirationDate: productList.expirationDate.split("T")[0], // Format for input[type="date"]
      });

      // Set selected products for display
      setSelectedProducts(
        productList.products.map((embeddedProduct) => ({
          _id: embeddedProduct.productId,
          nombre: embeddedProduct.nombre,
          unidad: embeddedProduct.unidad,
          descripcion: embeddedProduct.descripcion,
          orden: embeddedProduct.orden,
          imagen: embeddedProduct.imagen,
          insumos: embeddedProduct.insumos,
          cantidad: embeddedProduct.cantidad,
          totalCosto: embeddedProduct.totalCosto,
          totalVenta: embeddedProduct.totalVenta,
          labour: embeddedProduct.labour,
          estatus: embeddedProduct.estatus,
          createdAt: "",
          updatedAt: "",
        }))
      );
    } catch (err: any) {
      toast.error(err.message || "Error al cargar la lista de productos");
      router.push("/catalogos/listas-productos");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    if (!currentProductId) {
      toast.warning("Por favor selecciona un producto");
      return;
    }

    if (currentQuantity < 1) {
      toast.warning("La cantidad debe ser al menos 1");
      return;
    }

    const product = availableProducts.find((p) => p._id === currentProductId);
    if (!product) return;

    // Check if already added
    if (formData.products.some((p) => p.productId === currentProductId)) {
      toast.warning("Este producto ya esta agregado");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        { productId: currentProductId, cantidad: currentQuantity },
      ],
    }));

    setSelectedProducts((prev) => [
      ...prev,
      { ...product, cantidad: currentQuantity },
    ]);

    // Reset
    setCurrentProductId("");
    setCurrentQuantity(1);
  };

  const handleRemoveProduct = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.productId !== productId),
    }));

    setSelectedProducts((prev) => prev.filter((p) => p._id !== productId));
  };

  const calculateLotes = (product: Product & { cantidad: number }) => {
    let totalLotes = 0;
    product.insumos.forEach((insumo) => {
      const material = materials.find((m) => m._id === insumo.materialId);
      if (material && material.piecesPerPackage > 0) {
        const lotes =
          (insumo.cantidad * product.cantidad) / material.piecesPerPackage;
        totalLotes += lotes;
      }
    });
    return totalLotes;
  };

  const handleShowDesglose = (product: Product & { cantidad: number }) => {
    setDesgloseProduct(product);
    setShowDesglose(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validar que hay una sucursal seleccionada
      const branchToUse = isManager ? managerBranch : activeBranch;

      if (!branchToUse) {
        throw new Error(
          isManager
            ? "No se encontro una sucursal asignada para el gerente."
            : "No hay sucursal activa seleccionada. Por favor, selecciona una sucursal desde el selector de sucursales."
        );
      }

      if (
        !formData.name ||
        !formData.company ||
        !formData.branch ||
        !formData.expirationDate
      ) {
        throw new Error(
          "El nombre, empresa, sucursal y fecha de expiracion son obligatorios"
        );
      }

      if (formData.products.length === 0) {
        throw new Error("Debes agregar al menos un producto a la lista");
      }

      if (isEditing) {
        await productListsService.updateProductList(productListId, formData);
        toast.success("Lista de productos actualizada exitosamente");
      } else {
        const response = await productListsService.createProductList(formData);
        if (response.data?.status === false) {
          toast.success(
            "Lista de productos creada exitosamente. Se creo como inactiva porque ya existe una lista activa para esta sucursal"
          );
        } else {
          toast.success("Lista de productos creada exitosamente y activada");
        }
      }

      router.push("/catalogos/listas-productos");
    } catch (err: any) {
      setError(err.message || "Error al guardar la lista de productos");
      toast.error(err.message || "Error al guardar la lista de productos");
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    let totalProducts = selectedProducts.length;
    let totalGastado = 0;
    let gananciasBrutas = 0;

    selectedProducts.forEach((product) => {
      const cantidad = product.cantidad || 1;
      // totalCosto ya incluye labour
      totalGastado += product.totalCosto * cantidad;
      gananciasBrutas += product.totalVenta * cantidad;
    });

    const gananciasNetas = gananciasBrutas - totalGastado;

    return {
      totalProducts,
      totalGastado,
      gananciasBrutas,
      gananciasNetas,
    };
  };

  const totals = calculateTotals();

  if (loading && isEditing) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="new-product-list-page">
      {!isManager && !activeBranch && (
        <Alert variant="destructive" className="mb-3 border-yellow-500 bg-yellow-50 text-yellow-800">
          <AlertDescription>
            <strong>Advertencia:</strong> No hay sucursal activa seleccionada.
            Por favor, selecciona una sucursal desde el selector de sucursales en
            la parte superior para poder crear una lista de productos.
          </AlertDescription>
        </Alert>
      )}

      {isManager && !managerBranch && (
        <Alert variant="destructive" className="mb-3 border-yellow-500 bg-yellow-50 text-yellow-800">
          <AlertDescription>
            <strong>Advertencia:</strong> No se encontro una sucursal asignada para tu usuario.
            Por favor, contacta al administrador.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-3">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Informacion Basica */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardHeader className="bg-white border-0 py-3">
            <div className="flex items-center gap-2">
              <Package size={20} className="text-primary" />
              <h5 className="mb-0 font-bold">Informacion de la Lista</h5>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">
                  Nombre de la Lista <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Nombre de la lista"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="py-2"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">
                  Fecha de Expiracion <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expirationDate: e.target.value,
                    })
                  }
                  required
                  className="py-2"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">
                  Empresa <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  value={
                    userCompany?.tradeName ||
                    userCompany?.legalName ||
                    "Cargando..."
                  }
                  disabled
                  readOnly
                  className="py-2"
                />
                <p className="text-sm text-muted-foreground">
                  Empresa asignada a tu usuario
                </p>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">
                  Sucursal <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  value={
                    isManager
                      ? (managerBranch?.branchName || "Cargando sucursal...")
                      : (activeBranch?.branchName || "No hay sucursal seleccionada")
                  }
                  disabled
                  readOnly
                  className="py-2"
                />
                <p className="text-sm text-muted-foreground">
                  {isManager
                    ? "Sucursal asignada a tu usuario gerente"
                    : "Sucursal activa actual. Puede haber multiples listas por sucursal, pero solo una estara activa"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agregar Productos */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardHeader className="bg-white border-0 py-3">
            <div className="flex items-center gap-2">
              <Package size={20} className="text-primary" />
              <h5 className="mb-0 font-bold">Productos</h5>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
              <div className="md:col-span-6 space-y-2">
                <Label className="font-semibold">
                  Seleccionar Producto
                </Label>
                <Select
                  value={currentProductId}
                  onValueChange={(value) => setCurrentProductId(value)}
                >
                  <SelectTrigger className="py-2">
                    <SelectValue placeholder="-- Seleccionar un producto --" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts.map((product) => (
                      <SelectItem key={product._id} value={product._id}>
                        {product.nombre} ({product.unidad})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-4 space-y-2">
                <Label className="font-semibold">Cantidad</Label>
                <Input
                  type="number"
                  min="1"
                  value={currentQuantity}
                  onChange={(e) =>
                    setCurrentQuantity(parseInt(e.target.value) || 1)
                  }
                  className="py-2"
                />
              </div>

              <div className="md:col-span-2 flex items-end">
                <Button
                  type="button"
                  variant="default"
                  onClick={handleAddProduct}
                  className="w-full py-2 bg-green-600 hover:bg-green-700"
                  disabled={!currentProductId}
                >
                  <Plus size={18} className="mr-1" />
                  Agregar
                </Button>
              </div>
            </div>

            {/* Lista de Productos Seleccionados */}
            {selectedProducts.length > 0 && (
              <div className="overflow-x-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Producto</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead className="text-center">Cantidad</TableHead>
                      <TableHead className="text-right">Total Costo</TableHead>
                      <TableHead className="text-right">Labour</TableHead>
                      <TableHead className="text-right">Total Venta</TableHead>
                      <TableHead className="text-center">Lotes</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedProducts.map((product) => {
                      const cantidad = product.cantidad || 1;
                      const lotes = calculateLotes(product);
                      return (
                        <TableRow key={product._id} className="hover:bg-muted/50">
                          <TableCell>{product.nombre}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{product.unidad}</Badge>
                          </TableCell>
                          <TableCell className="text-center font-bold">{cantidad}</TableCell>
                          <TableCell className="text-right text-red-600">
                            ${formatNumber(product.totalCosto * cantidad)}
                          </TableCell>
                          <TableCell className="text-right text-yellow-600">
                            ${formatNumber(product.labour * cantidad)}
                          </TableCell>
                          <TableCell className="text-right text-primary">
                            ${formatNumber(product.totalVenta * cantidad)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="bg-cyan-500 text-white">
                              {formatNumber(lotes)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex gap-1 justify-center">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleShowDesglose(product)}
                                title="Ver desglose"
                                className="text-cyan-500 border-cyan-500 hover:bg-cyan-50"
                              >
                                <List size={14} />
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveProduct(product._id)}
                                title="Eliminar"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter className="bg-muted/50 font-bold">
                    <TableRow>
                      <TableCell colSpan={3} className="text-right">
                        Totales ({totals.totalProducts} productos):
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        ${formatNumber(totals.totalGastado)}
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right text-primary">
                        ${formatNumber(totals.gananciasBrutas)}
                      </TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={7} className="text-right">
                        Ganancias Netas:
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={`text-base ${totals.gananciasNetas >= 0 ? "bg-green-600" : "bg-red-600"} text-white`}
                        >
                          ${formatNumber(totals.gananciasNetas)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botones */}
        <div className="flex justify-between gap-2 mb-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Volver
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="flex items-center gap-2 px-8"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>

      {/* Modal de Desglose */}
      <DesgloseModal
        show={showDesglose}
        onHide={() => setShowDesglose(false)}
        product={desgloseProduct}
        materials={materials}
      />
    </div>
  );
};

export default NewProductListPage;
