"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Trash2,
  Upload,
  Save,
  ArrowLeft,
  Edit2,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import { productsService } from "./services/products";
import { CreateProductData, Insumo, InsumoType, UnidadType } from "./types";
import { materialsService } from "../materials/services/materials";
import { Material } from "../materials/types";
import { productCategoriesService } from "../productCategories/services/productCategories";
import { ProductCategory } from "../productCategories/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const UNIDADES_OPTIONS: UnidadType[] = ["pieza", "paquete"];

const NewProductPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;
  const isEditing = !!productId;

  const [formData, setFormData] = useState<CreateProductData>({
    nombre: "",
    unidad: "pieza",
    descripcion: "",
    productCategory: null,
    orden: 0,
    imagen: "",
    insumos: [],
    labour: 0,
    estatus: true,
  });

  const [currentInsumo, setCurrentInsumo] = useState<Partial<Insumo>>({
    materialId: "",
    nombre: "",
    cantidad: 1,
    unidad: "pieza",
    importeCosto: 0,
    importeVenta: 0,
  });

  // Precios unitarios para el insumo actual
  const [unitCost, setUnitCost] = useState<number>(0);
  const [unitPrice, setUnitPrice] = useState<number>(0);

  // Precio de venta final editable
  const [precioVentaEditable, setPrecioVentaEditable] = useState<number>(0);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingInsumoIndex, setEditingInsumoIndex] = useState<number | null>(
    null
  );
  const [materials, setMaterials] = useState<Material[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>(
    []
  );
  const [labourType, setLabourType] = useState<"fixed" | "percentage">("fixed");
  const [labourPercentage, setLabourPercentage] = useState<number>(0);

  // Cargar materiales activos y categorias
  useEffect(() => {
    loadMaterials();
    loadProductCategories();
  }, []);

  // Cargar producto si estamos editando
  useEffect(() => {
    if (isEditing) {
      loadProduct();
    }
  }, [productId]);

  const loadMaterials = async () => {
    try {
      const response = await materialsService.getAllMaterials({
        status: true,
        limit: 1000,
      });
      setMaterials(response.data);

      // Si hay materiales, establecer el primero como valor por defecto
      if (response.data.length > 0) {
        const firstMaterial = response.data[0];
        setCurrentInsumo({
          materialId: firstMaterial._id,
          nombre: firstMaterial.name,
          cantidad: 1,
          unidad: firstMaterial.unit.abbreviation,
          importeCosto: firstMaterial.cost,
          importeVenta: firstMaterial.price,
        });
        setUnitCost(firstMaterial.cost);
        setUnitPrice(firstMaterial.price);
      }
    } catch (err: any) {
      toast.error(err.message || "Error al cargar los materiales");
    }
  };

  const loadProductCategories = async () => {
    try {
      const response = await productCategoriesService.getAllProductCategories({
        isActive: true,
        limit: 1000,
      });
      setProductCategories(response.data);
    } catch (err: any) {
      toast.error(err.message || "Error al cargar las categorias");
    }
  };

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await productsService.getProductById(productId);
      const product = response.data;
      setFormData({
        nombre: product.nombre,
        unidad: product.unidad,
        descripcion: product.descripcion,
        productCategory: product.productCategory?._id || null,
        orden: product.orden,
        imagen: product.imagen,
        insumos: product.insumos,
        labour: product.labour || 0,
        estatus: product.estatus,
      });

      // Cargar precio de venta final (totalVenta del producto)
      if (product.totalVenta) {
        setPrecioVentaEditable(product.totalVenta);
      }

      // Establecer preview de imagen si existe
      if (product.imagen) {
        setImagePreview(product.imagen);
      }

      // Detectar si labour es porcentaje o fijo
      const totalVentaInsumos =
        product.insumos?.reduce(
          (sum, insumo) => sum + insumo.importeVenta,
          0
        ) || 0;
      if (totalVentaInsumos > 0 && product.labour > 0) {
        const calculatedPercentage = (product.labour / totalVentaInsumos) * 100;
        // Si el porcentaje es un numero entero razonable (ej: 10%, 15%, 20%), asumimos que fue ingresado como porcentaje
        if (calculatedPercentage % 1 === 0 && calculatedPercentage <= 100) {
          setLabourType("percentage");
          setLabourPercentage(calculatedPercentage);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Error al cargar el producto");
      router.push("/catalogos/productos");
    } finally {
      setLoading(false);
    }
  };

  // Funcion para formatear numeros con separacion de miles
  const formatNumber = (num: number): string => {
    return num.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Calcular totales
  const calculateTotals = () => {
    const totalCosto =
      formData.insumos?.reduce((sum, insumo) => sum + insumo.importeCosto, 0) ||
      0;
    const totalVenta =
      formData.insumos?.reduce((sum, insumo) => sum + insumo.importeVenta, 0) ||
      0;
    const precioVentaCalculado = totalVenta + formData.labour;
    const precioVentaFinal =
      precioVentaEditable > 0 ? precioVentaEditable : precioVentaCalculado;
    return { totalCosto, totalVenta, precioVentaFinal, precioVentaCalculado };
  };

  // Cargar insumo para editar
  const handleEditInsumo = (index: number) => {
    const insumo = formData.insumos?.[index];
    if (insumo) {
      setCurrentInsumo({ ...insumo });
      // Calcular precios unitarios basados en los importes y cantidad
      const cantidad = insumo.cantidad || 1;
      setUnitCost(insumo.importeCosto / cantidad);
      setUnitPrice(insumo.importeVenta / cantidad);
      setEditingInsumoIndex(index);
    }
  };

  // Cancelar edicion de insumo
  const handleCancelEditInsumo = () => {
    if (materials.length > 0) {
      const firstMaterial = materials[0];
      setCurrentInsumo({
        materialId: firstMaterial._id,
        nombre: firstMaterial.name,
        cantidad: 1,
        unidad: firstMaterial.unit.abbreviation,
        importeCosto: firstMaterial.cost,
        importeVenta: firstMaterial.price,
      });
      setUnitCost(firstMaterial.cost);
      setUnitPrice(firstMaterial.price);
    }
    setEditingInsumoIndex(null);
    setError(null);
  };

  // Agregar o actualizar insumo
  const handleAddInsumo = () => {
    if (
      !currentInsumo.materialId ||
      !currentInsumo.nombre ||
      (currentInsumo.cantidad || 0) <= 0
    ) {
      setError("Por favor completa todos los campos del insumo");
      return;
    }

    // Calcular importes basados en cantidad y precios unitarios
    const cantidad = currentInsumo.cantidad || 0;
    const importeCosto = cantidad * unitCost;
    const importeVenta = cantidad * unitPrice;

    const insumoToAdd = {
      ...currentInsumo,
      importeCosto,
      importeVenta,
    };

    if (editingInsumoIndex !== null) {
      // Actualizar insumo existente
      const newInsumos = [...(formData.insumos || [])];
      newInsumos[editingInsumoIndex] = insumoToAdd as Insumo;
      setFormData({ ...formData, insumos: newInsumos });
      setEditingInsumoIndex(null);
    } else {
      // Agregar nuevo insumo
      const newInsumos = [...(formData.insumos || []), insumoToAdd as Insumo];
      setFormData({ ...formData, insumos: newInsumos });
    }

    // Reset current insumo
    if (materials.length > 0) {
      const firstMaterial = materials[0];
      setCurrentInsumo({
        materialId: firstMaterial._id,
        nombre: firstMaterial.name,
        cantidad: 1,
        unidad: firstMaterial.unit.abbreviation,
        importeCosto: firstMaterial.cost,
        importeVenta: firstMaterial.price,
      });
      setUnitCost(firstMaterial.cost);
      setUnitPrice(firstMaterial.price);
    }
    setError(null);
  };

  // Eliminar insumo
  const handleRemoveInsumo = (index: number) => {
    const newInsumos = formData.insumos?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, insumos: newInsumos });

    // Si estamos eliminando el insumo que se esta editando, cancelar edicion
    if (editingInsumoIndex === index) {
      handleCancelEditInsumo();
    } else if (editingInsumoIndex !== null && editingInsumoIndex > index) {
      // Si el indice de edicion es mayor, ajustarlo
      setEditingInsumoIndex(editingInsumoIndex - 1);
    }
  };

  // Manejar cambio de archivo de imagen
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log("Archivo seleccionado:", file.name, file.size);
      setImageFile(file);

      // Convertir a base64 y crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        console.log("Base64 generado, longitud:", base64String.length);
        setImagePreview(base64String);
        setFormData((prev) => {
          const updated = { ...prev, imagen: base64String };
          console.log(
            "FormData actualizado, imagen length:",
            updated.imagen?.length
          );
          return updated;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Eliminar imagen
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setFormData((prev) => ({ ...prev, imagen: "" }));
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.nombre || !formData.unidad) {
        throw new Error("El nombre y la unidad son obligatorios");
      }

      // Los datos del producto con la imagen en base64
      const productData: CreateProductData = {
        ...formData,
        imagen: formData.imagen || "",
        precioVentaFinal: precioVentaEditable,
      };

      console.log("Datos a enviar:", productData);
      console.log("Imagen URL length:", formData.imagen?.length || 0);

      if (isEditing) {
        await productsService.updateProduct(productId, productData);
        toast.success("Producto actualizado exitosamente");
      } else {
        await productsService.createProduct(productData);
        toast.success("Producto creado exitosamente");
      }

      router.push("/catalogos/productos");
    } catch (err: any) {
      setError(err.message || "Error al guardar el producto");
      toast.error(err.message || "Error al guardar el producto");
    } finally {
      setLoading(false);
    }
  };

  const { totalCosto, totalVenta, precioVentaFinal, precioVentaCalculado } =
    calculateTotals();

  // Actualizar precio editable cuando cambien los calculos
  useEffect(() => {
    if (precioVentaEditable === 0) {
      setPrecioVentaEditable(precioVentaCalculado);
    }
  }, [precioVentaCalculado, precioVentaEditable]);

  if (loading && isEditing) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="new-product-page">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="h-auto p-0 ml-2"
            >
              <X size={16} />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Informacion Basica */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardHeader className="bg-background border-b-0 py-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package size={20} className="text-primary" />
              Informacion del Producto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Nombre del producto"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">Categoria de Producto</Label>
                <Select
                  value={formData.productCategory || "none"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      productCategory: value === "none" ? null : value,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona una categoria (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      Selecciona una categoria (opcional)
                    </SelectItem>
                    {productCategories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">
                  Unidad <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.unidad}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      unidad: value as UnidadType,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIDADES_OPTIONS.map((unidad) => (
                      <SelectItem key={unidad} value={unidad}>
                        {unidad.charAt(0).toUpperCase() + unidad.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">Orden</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.orden}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      orden: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="font-semibold">Descripcion</Label>
                <Textarea
                  rows={3}
                  placeholder="Descripcion del producto"
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Imagen */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardHeader className="bg-background border-b-0 py-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload size={20} className="text-primary" />
              Imagen del Producto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label className="font-semibold">Subir Imagen</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <p className="text-sm text-muted-foreground">
                  Selecciona una imagen para el producto (JPG, PNG, etc.)
                </p>
              </div>

              <div>
                {imagePreview && (
                  <div className="space-y-2">
                    <Label className="font-semibold">Vista previa</Label>
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="rounded border-2 shadow-sm w-28 h-28 object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-sm"
                        className="absolute -top-2 -right-2 rounded-full"
                        onClick={handleRemoveImage}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insumos */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardHeader className="bg-background border-b-0 py-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package size={20} className="text-primary" />
              Insumos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mensaje informativo cuando se esta editando */}
            {editingInsumoIndex !== null && (
              <Alert className="mb-4 border-blue-200 bg-blue-50">
                <Edit2 size={16} className="text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Editando insumo #{editingInsumoIndex + 1}. Modifica los campos
                  y guarda los cambios.
                </AlertDescription>
              </Alert>
            )}

            {/* Formulario para agregar insumos */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
              <div className={editingInsumoIndex !== null ? "md:col-span-2" : "md:col-span-3"}>
                <Label className="font-semibold text-sm">Material</Label>
                <Select
                  value={currentInsumo.materialId || ""}
                  onValueChange={(value) => {
                    const selectedMaterial = materials.find(
                      (m) => m._id === value
                    );
                    if (selectedMaterial) {
                      setCurrentInsumo({
                        ...currentInsumo,
                        materialId: selectedMaterial._id,
                        nombre: selectedMaterial.name,
                        unidad: selectedMaterial.unit.abbreviation,
                        importeCosto: selectedMaterial.cost,
                        importeVenta: selectedMaterial.price,
                      });
                      setUnitCost(selectedMaterial.cost);
                      setUnitPrice(selectedMaterial.price);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No hay materiales disponibles
                      </SelectItem>
                    ) : (
                      materials.map((material) => (
                        <SelectItem key={material._id} value={material._id}>
                          {material.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label className="font-semibold text-sm">Cantidad</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentInsumo.cantidad}
                  onChange={(e) =>
                    setCurrentInsumo({
                      ...currentInsumo,
                      cantidad: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="md:col-span-2">
                <Label className="font-semibold text-sm">Unidad</Label>
                <Select
                  value={currentInsumo.unidad || "pieza"}
                  onValueChange={(value) =>
                    setCurrentInsumo({
                      ...currentInsumo,
                      unidad: value,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIDADES_OPTIONS.map((unidad) => (
                      <SelectItem key={unidad} value={unidad}>
                        {unidad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label className="font-semibold text-sm">Costo Unit.</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={unitCost}
                  onChange={(e) =>
                    setUnitCost(parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              <div className="md:col-span-2">
                <Label className="font-semibold text-sm">Precio Unit.</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={unitPrice}
                  onChange={(e) =>
                    setUnitPrice(parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              <div className={`flex items-end gap-1 ${editingInsumoIndex !== null ? "md:col-span-2" : "md:col-span-1"}`}>
                {editingInsumoIndex !== null && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEditInsumo}
                    className="flex-1"
                    title="Cancelar"
                  >
                    <X size={18} />
                  </Button>
                )}
                <Button
                  type="button"
                  variant={editingInsumoIndex !== null ? "default" : "default"}
                  size="sm"
                  onClick={handleAddInsumo}
                  className={`flex-1 ${editingInsumoIndex === null ? "bg-green-600 hover:bg-green-700" : ""}`}
                  title={editingInsumoIndex !== null ? "Actualizar" : "Agregar"}
                >
                  {editingInsumoIndex !== null ? (
                    <Save size={18} />
                  ) : (
                    <Plus size={18} />
                  )}
                </Button>
              </div>
            </div>

            {/* Tabla de insumos */}
            {formData.insumos && formData.insumos.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>No.</TableHead>
                    <TableHead>Insumo</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Importe costo</TableHead>
                    <TableHead>Importe venta</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.insumos.map((insumo, index) => {
                    return (
                      <TableRow
                        key={index}
                        className={
                          editingInsumoIndex === index ? "bg-blue-50" : ""
                        }
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{insumo.nombre}</TableCell>
                        <TableCell>{insumo.cantidad}</TableCell>
                        <TableCell>{insumo.unidad}</TableCell>
                        <TableCell className="text-green-600">
                          ${formatNumber(insumo.importeCosto)}
                        </TableCell>
                        <TableCell className="text-primary">
                          ${formatNumber(insumo.importeVenta)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-1 justify-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              onClick={() => handleEditInsumo(index)}
                              disabled={editingInsumoIndex !== null}
                              title="Editar"
                            >
                              <Edit2 size={14} />
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon-sm"
                              onClick={() => handleRemoveInsumo(index)}
                              disabled={editingInsumoIndex !== null}
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
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-bold">
                      Totales:
                    </TableCell>
                    <TableCell className="text-green-600 font-bold">
                      ${formatNumber(totalCosto)}
                    </TableCell>
                    <TableCell className="text-primary font-bold">
                      ${formatNumber(totalVenta)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Mano de Obra */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardHeader className="bg-background border-b-0 py-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package size={20} className="text-primary" />
              Mano de Obra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">Tipo de Calculo</Label>
                <Select
                  value={labourType}
                  onValueChange={(value: "fixed" | "percentage") => {
                    setLabourType(value);
                    // Si cambia a fijo, mantener el valor actual de labour
                    // Si cambia a porcentaje, calcular el porcentaje basado en labour actual
                    if (
                      value === "percentage" &&
                      totalVenta > 0 &&
                      formData.labour > 0
                    ) {
                      const percentage = (formData.labour / totalVenta) * 100;
                      setLabourPercentage(parseFloat(percentage.toFixed(2)));
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Monto Fijo</SelectItem>
                    <SelectItem value="percentage">Porcentaje</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {labourType === "fixed" ? (
                <div className="md:col-span-2 space-y-2">
                  <Label className="font-semibold">Costo de Mano de Obra</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.labour}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        labour: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Ingresa el monto fijo de mano de obra
                  </p>
                </div>
              ) : (
                <div className="md:col-span-2 space-y-2">
                  <Label className="font-semibold">Porcentaje de Mano de Obra</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="0"
                      value={labourPercentage}
                      onChange={(e) => {
                        const percentage = parseFloat(e.target.value) || 0;
                        setLabourPercentage(percentage);
                        // Calcular labour basado en el porcentaje del total de venta
                        const calculatedLabour =
                          (totalVenta * percentage) / 100;
                        setFormData({
                          ...formData,
                          labour: parseFloat(calculatedLabour.toFixed(2)),
                        });
                      }}
                    />
                    <span className="font-bold">%</span>
                  </div>
                  {labourPercentage > 0 ? (
                    <div className="mt-2 p-2 bg-muted rounded">
                      <span className="text-lg font-bold text-primary">
                        {labourPercentage}% de ${formatNumber(totalVenta)} = $
                        {formatNumber(formData.labour)}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Ingresa el porcentaje sobre el total de venta de insumos
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Precio de Venta Final */}
        <Card className="mb-4">
          <CardHeader className="bg-green-600 text-white py-3 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Package size={20} />
              Precio de Venta Final
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Total Insumos:</span>
                  <span className="text-lg text-green-600">
                    ${formatNumber(totalCosto)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Mano de Obra:</span>
                  <span className="text-lg text-yellow-600">
                    ${formatNumber(formData.labour)}
                  </span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xl">Precio de Venta Final:</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={precioVentaEditable}
                      onChange={(e) =>
                        setPrecioVentaEditable(parseFloat(e.target.value) || 0)
                      }
                      className="text-2xl font-bold text-green-600 w-36 text-right border-green-500"
                    />
                    <span className="text-2xl font-bold text-green-600">$</span>
                    {precioVentaEditable !== precioVentaCalculado && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPrecioVentaEditable(precioVentaCalculado)
                        }
                        title="Resetear al precio calculado"
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="p-4 bg-muted rounded">
                  <h6 className="text-muted-foreground mb-2">Desglose del Precio</h6>
                  <div className="text-base">
                    <div className="mb-1">
                      <span className="text-green-600">Insumos:</span> $
                      {formatNumber(totalCosto)}
                    </div>
                    <div className="mb-1">
                      <span className="text-yellow-600">Mano de Obra:</span> $
                      {formatNumber(formData.labour)}
                    </div>
                    <hr className="my-2" />
                    <div className="font-bold text-green-600">
                      <span>Total:</span> ${formatNumber(precioVentaFinal)}
                    </div>
                    {precioVentaEditable !== precioVentaCalculado && (
                      <div className="mt-2 p-2 bg-yellow-100 rounded">
                        <small className="text-yellow-700">
                          <strong>Ajuste:</strong> +$
                          {formatNumber(
                            precioVentaEditable - precioVentaCalculado
                          )}
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewProductPage;
