"use client";

import React, { useEffect, useState } from "react";
import {
  Package,
  ArrowLeft,
  Search,
  Gift,
  Star,
  Check,
  X,
  Save,
  ShoppingBag,
  Edit2,
  Plus,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { storageService } from "@/features/admin/modules/storage/services/storage";
import { Storage } from "@/features/admin/modules/storage/types";
import { pointsRewardService } from "./services/pointsReward";
import { PointsReward, CreatePointsRewardData, UpdatePointsRewardData } from "./types";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import PointsRewardModal from "./components/PointsRewardModal";
import { branchesService } from "../branches/services/branches";
import { Branch } from "../branches/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ProductWithStock {
  _id: string;
  productId: {
    _id: string;
    nombre: string;
    imagen?: string;
    totalVenta?: number;
    descripcion?: string;
  };
  quantity: number;
}

interface SelectedProduct {
  productId: string;
  nombre: string;
  imagen?: string;
  precio: number;
  stock: number;
}

const ProductRewardsPage: React.FC = () => {
  const router = useRouter();
  const { user } = useUserSessionStore();
  const { activeBranch } = useActiveBranchStore();
  const { hasRole } = useUserRoleStore();
  const isManager = hasRole("Gerente");
  const isAdmin = hasRole("Administrador") || hasRole("Admin");

  const [storage, setStorage] = useState<Storage | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [existingProductRewards, setExistingProductRewards] = useState<PointsReward[]>([]);
  const [managerBranch, setManagerBranch] = useState<Branch | null>(null);
  const [currentBranchId, setCurrentBranchId] = useState<string | null>(null);

  // Modal para crear recompensa de producto
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({
    pointsRequired: 100,
    productQuantity: 1,
    maxRedemptionsPerClient: 0,
    maxTotalRedemptions: 0,
    status: true,
  });

  // Modal para editar recompensa existente
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<PointsReward | null>(null);
  const [editModalLoading, setEditModalLoading] = useState(false);

  // Cargar sucursal del gerente si aplica
  const loadManagerBranch = async () => {
    try {
      const response = await branchesService.getUserBranches();
      if (response.success && response.data && response.data.length > 0) {
        const branch = response.data[0];
        setManagerBranch(branch);
        setCurrentBranchId(branch._id);
        console.log("Sucursal del gerente cargada:", branch.branchName);
        return branch._id;
      } else {
        toast.error("No se encontro una sucursal asignada para el gerente");
        return null;
      }
    } catch (error: any) {
      console.error("Error al cargar sucursal del gerente:", error);
      toast.error(error.message || "Error al cargar la sucursal del gerente");
      return null;
    }
  };

  useEffect(() => {
    const initializeBranch = async () => {
      if (isManager) {
        const branchId = await loadManagerBranch();
        if (branchId) {
          loadStorageAndRewards(branchId);
        }
      } else if (isAdmin && activeBranch?._id) {
        setCurrentBranchId(activeBranch._id);
        loadStorageAndRewards(activeBranch._id);
      }
    };

    initializeBranch();
  }, [isManager, isAdmin, activeBranch]);

  const loadStorageAndRewards = async (branchId?: string) => {
    const targetBranchId = branchId || currentBranchId;
    if (!targetBranchId) return;

    setLoading(true);
    try {
      const storageResponse = await storageService.getStorageByBranch(targetBranchId);
      if (storageResponse.data) {
        setStorage(storageResponse.data);
      }

      const rewardsResponse = await pointsRewardService.getPointsRewardsByBranch(targetBranchId);
      const productRewards = rewardsResponse.data.filter(
        (reward) => reward.isProducto === true
      );
      setExistingProductRewards(productRewards);
    } catch (error: any) {
      console.error("Error loading data:", error);
      if (!error.message?.includes("no encontr")) {
        toast.error("Error al cargar los datos");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product: ProductWithStock) => {
    const existingReward = existingProductRewards.find((reward) => {
      const productId = typeof reward.productId === "string"
        ? reward.productId
        : reward.productId?._id;
      return productId === product.productId._id;
    });

    if (existingReward) {
      toast.info("Este producto ya tiene una recompensa configurada");
      return;
    }

    setSelectedProduct({
      productId: product.productId._id,
      nombre: product.productId.nombre,
      imagen: product.productId.imagen,
      precio: product.productId.totalVenta || 0,
      stock: product.quantity,
    });
    setFormData({
      pointsRequired: 100,
      productQuantity: 1,
      maxRedemptionsPerClient: 0,
      maxTotalRedemptions: 0,
      status: true,
    });
    setShowModal(true);
  };

  const handleCreateReward = async () => {
    if (!selectedProduct) return;

    const branchToUse = isManager ? managerBranch?._id : currentBranchId;

    if (!branchToUse) {
      toast.error(
        isManager
          ? "No se encontro una sucursal asignada para el gerente"
          : "No se ha seleccionado una sucursal"
      );
      return;
    }

    if (formData.pointsRequired < 1) {
      toast.error("Los puntos requeridos deben ser al menos 1");
      return;
    }

    if (formData.productQuantity < 1) {
      toast.error("La cantidad debe ser al menos 1");
      return;
    }

    setModalLoading(true);
    try {
      const rewardData: CreatePointsRewardData = {
        name: `${selectedProduct.nombre} (x${formData.productQuantity})`,
        description: `Canjea ${formData.pointsRequired} puntos por ${formData.productQuantity} ${selectedProduct.nombre}`,
        pointsRequired: formData.pointsRequired,
        rewardType: "product",
        rewardValue: selectedProduct.precio * formData.productQuantity,
        isProducto: true,
        productId: selectedProduct.productId,
        productQuantity: formData.productQuantity,
        isPercentage: false,
        maxRedemptionsPerClient: formData.maxRedemptionsPerClient,
        maxTotalRedemptions: formData.maxTotalRedemptions,
        branch: branchToUse,
        status: formData.status,
      };

      await pointsRewardService.createPointsReward(rewardData);
      toast.success("Recompensa de producto creada exitosamente");
      setShowModal(false);
      loadStorageAndRewards();
    } catch (error: any) {
      toast.error(error.message || "Error al crear la recompensa");
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditReward = (reward: PointsReward) => {
    setSelectedReward(reward);
    setShowEditModal(true);
  };

  const handleSaveReward = async (data: CreatePointsRewardData | UpdatePointsRewardData) => {
    if (!selectedReward) return;

    setEditModalLoading(true);
    try {
      await pointsRewardService.updatePointsReward(selectedReward._id, data);
      toast.success("Recompensa actualizada exitosamente");
      setShowEditModal(false);
      loadStorageAndRewards();
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar la recompensa");
    } finally {
      setEditModalLoading(false);
    }
  };

  const isProductAlreadyReward = (productId: string): boolean => {
    return existingProductRewards.some((reward) => {
      const rewardProductId = typeof reward.productId === "string"
        ? reward.productId
        : reward.productId?._id;
      return rewardProductId === productId;
    });
  };

  const getProductReward = (productId: string): PointsReward | undefined => {
    return existingProductRewards.find((reward) => {
      const rewardProductId = typeof reward.productId === "string"
        ? reward.productId
        : reward.productId?._id;
      return rewardProductId === productId;
    });
  };

  const formatPrice = (price: number): string => {
    return price.toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });
  };

  const products = storage?.products || [];
  const filteredProducts = products.filter((item: any) =>
    item.productId?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Renderizar card de recompensa de producto existente
  const renderProductRewardCard = (reward: PointsReward) => {
    const product = typeof reward.productId === "object" ? reward.productId : null;

    return (
      <div key={reward._id} className="col-span-1">
        <Card className="shadow-sm h-full overflow-hidden">
          {/* Product Image */}
          <div className="relative h-[140px]">
            {product?.imagen ? (
              <img
                src={product.imagen}
                alt={product.nombre}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="bg-gray-100 flex items-center justify-center h-full">
                <Package size={32} className="text-muted-foreground opacity-50" />
              </div>
            )}
            {/* Points Badge */}
            <div className="absolute top-2 left-2">
              <Badge className="px-2 py-1 text-xs">
                {reward.pointsRequired} pts
              </Badge>
            </div>
            {/* Status Badge */}
            <div className="absolute top-2 right-2">
              <Badge
                variant={reward.status ? "default" : "secondary"}
                className="px-2 py-1 text-[10px]"
              >
                {reward.status ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </div>
          <CardContent className="p-3">
            <h6
              className="font-semibold mb-1 truncate text-sm"
              title={product?.nombre || reward.name}
            >
              {product?.nombre || reward.name}
            </h6>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">
                x{reward.productQuantity || 1} unidad(es)
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto text-muted-foreground hover:text-foreground"
                onClick={() => handleEditReward(reward)}
                title="Editar"
              >
                <Edit2 size={14} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="product-rewards-page">
      {/* Mensajes de advertencia para sucursal */}
      {!isManager && !activeBranch && (
        <Alert variant="destructive" className="mb-4 bg-yellow-50 border-yellow-200 text-yellow-800">
          <AlertDescription>
            <strong>Advertencia:</strong> No hay sucursal activa seleccionada.
            Por favor, selecciona una sucursal desde el selector de sucursales en
            la parte superior para poder configurar productos como recompensa.
          </AlertDescription>
        </Alert>
      )}

      {isManager && !managerBranch && (
        <Alert variant="destructive" className="mb-4 bg-yellow-50 border-yellow-200 text-yellow-800">
          <AlertDescription>
            <strong>Advertencia:</strong> No se encontro una sucursal asignada para tu usuario.
            Por favor, contacta al administrador.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/panel/config-puntos")}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Volver
          </Button>
          <div>
            <h5 className="text-lg font-semibold mb-0">Productos como Recompensa</h5>
            <span className="text-muted-foreground text-sm">
              {isManager
                ? (managerBranch?.branchName || "Cargando sucursal...")
                : (activeBranch?.branchName || "Sucursal")}
            </span>
          </div>
        </div>
      </div>

      {/* Seccion: Recompensas de Productos Configuradas */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag size={20} className="text-primary" />
          <h6 className="text-sm uppercase text-muted-foreground font-semibold tracking-wide mb-0">
            Recompensas Configuradas
          </h6>
          <Badge variant="secondary" className="ml-2">
            {existingProductRewards.length}
          </Badge>
        </div>

        {existingProductRewards.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="text-center py-8">
              <ShoppingBag size={48} className="text-muted-foreground mb-4 opacity-50 mx-auto" />
              <h6 className="text-muted-foreground font-medium">No hay productos configurados como recompensa</h6>
              <p className="text-muted-foreground text-sm mb-0">
                Selecciona productos del catalogo de abajo para agregarlos como recompensa
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {existingProductRewards.map((reward) => renderProductRewardCard(reward))}
          </div>
        )}
      </div>

      {/* Seccion: Seleccionar Productos del Almacen */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Package size={20} className="text-primary" />
            <h6 className="text-sm uppercase text-muted-foreground font-semibold tracking-wide mb-0">
              Catalogo de Productos
            </h6>
          </div>
          <Badge className="px-3 py-1.5">
            {filteredProducts.length} disponibles
          </Badge>
        </div>

        {/* Search */}
        <Card className="shadow-sm mb-6">
          <CardContent className="py-4">
            <div className="relative max-w-[400px]">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {!storage ? (
          <Alert variant="destructive" className="bg-yellow-50 border-yellow-200 text-yellow-800">
            <Package size={20} className="mr-2" />
            <AlertDescription>
              No hay almacen asignado a esta sucursal. Configura un almacen primero.
            </AlertDescription>
          </Alert>
        ) : filteredProducts.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="text-center py-12">
              <Package size={64} className="text-muted-foreground opacity-50 mb-4 mx-auto" />
              <h5 className="text-muted-foreground font-medium">No hay productos disponibles</h5>
              <p className="text-muted-foreground mb-0">
                {searchTerm
                  ? "No se encontraron productos con ese nombre"
                  : "Agrega productos al almacen de esta sucursal"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((item: any) => {
              const product = item.productId;
              const isReward = isProductAlreadyReward(product._id);
              const reward = getProductReward(product._id);

              return (
                <div key={item._id}>
                  <Card
                    className={`shadow-sm h-full overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                      isReward ? "opacity-85" : ""
                    } ${!isReward && (isManager ? managerBranch : currentBranchId) ? "cursor-pointer" : ""}`}
                    onClick={() => !isReward && (isManager ? managerBranch : currentBranchId) && handleProductClick(item)}
                  >
                    {/* Product Image */}
                    <div className="relative">
                      {product.imagen ? (
                        <div className="h-[180px] overflow-hidden">
                          <img
                            src={product.imagen}
                            alt={product.nombre}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="bg-gray-100 flex items-center justify-center h-[180px]">
                          <Package size={48} className="text-muted-foreground opacity-50" />
                        </div>
                      )}

                      {/* Badges */}
                      {isReward && (
                        <div className="absolute top-2.5 left-2.5">
                          <Badge className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500">
                            <Check size={12} />
                            {reward?.pointsRequired} pts
                          </Badge>
                        </div>
                      )}

                      {/* Stock Badge */}
                      <div className="absolute top-2.5 right-2.5">
                        <Badge
                          variant={item.quantity > 0 ? "default" : "destructive"}
                          className="px-2 py-1 text-[10px]"
                        >
                          Stock: {item.quantity}
                        </Badge>
                      </div>

                      {/* Quick Add Button */}
                      {!isReward && (isManager ? managerBranch : currentBranchId) && (
                        <div
                          className="absolute bottom-2.5 right-2.5 flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-500 shadow-lg transition-transform hover:scale-110"
                        >
                          <Plus size={18} className="text-white" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <CardContent className="p-3">
                      <h6
                        className="font-semibold mb-2 text-foreground text-sm leading-tight h-[2.6em] overflow-hidden line-clamp-2"
                      >
                        {product.nombre}
                      </h6>

                      {/* Rating placeholder */}
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={12}
                            className={star <= 4 ? "text-yellow-400" : "text-muted-foreground"}
                            fill={star <= 4 ? "#facc15" : "none"}
                          />
                        ))}
                        <span className="text-muted-foreground text-sm ml-1">(--)</span>
                      </div>

                      {/* Price */}
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-red-500 font-bold text-lg">
                            {formatPrice(product.totalVenta || 0)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para crear recompensa de producto */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift size={20} className="text-primary" />
              Configurar Recompensa
            </DialogTitle>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4">
              {/* Product Preview */}
              <Card className="border">
                <CardContent className="flex items-center gap-3 p-4">
                  {selectedProduct.imagen ? (
                    <img
                      src={selectedProduct.imagen}
                      alt={selectedProduct.nombre}
                      className="w-[60px] h-[60px] object-cover rounded-lg"
                    />
                  ) : (
                    <div className="bg-gray-100 flex items-center justify-center w-[60px] h-[60px] rounded-lg">
                      <Package size={24} className="text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h6 className="font-medium mb-1">{selectedProduct.nombre}</h6>
                    <span className="text-muted-foreground text-sm">
                      Precio: {formatPrice(selectedProduct.precio)} | Stock: {selectedProduct.stock}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Puntos Requeridos <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.pointsRequired}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pointsRequired: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                  <p className="text-muted-foreground text-xs">
                    Puntos que el cliente debe canjear
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>
                    Cantidad del Producto <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max={selectedProduct.stock}
                    value={formData.productQuantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        productQuantity: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                  <p className="text-muted-foreground text-xs">
                    Unidades a entregar por canje
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max. canjes por cliente</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0 = ilimitado"
                    value={formData.maxRedemptionsPerClient}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxRedemptionsPerClient: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max. canjes totales</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0 = ilimitado"
                    value={formData.maxTotalRedemptions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxTotalRedemptions: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="status"
                  checked={formData.status}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, status: checked as boolean })
                  }
                />
                <Label htmlFor="status" className="cursor-pointer">
                  Recompensa Activa
                </Label>
              </div>

              {/* Preview de la recompensa */}
              <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                <AlertDescription>
                  <strong>Vista previa:</strong> Los clientes podran canjear{" "}
                  <strong>{formData.pointsRequired} puntos</strong> por{" "}
                  <strong>{formData.productQuantity} {selectedProduct.nombre}</strong>
                  {" "}(valor: {formatPrice(selectedProduct.precio * formData.productQuantity)})
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              disabled={modalLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateReward}
              disabled={modalLoading}
              className="flex items-center gap-2"
            >
              {modalLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Crear Recompensa
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para editar recompensa existente */}
      <PointsRewardModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        reward={selectedReward}
        onSave={handleSaveReward}
        loading={editModalLoading}
      />
    </div>
  );
};

export default ProductRewardsPage;
