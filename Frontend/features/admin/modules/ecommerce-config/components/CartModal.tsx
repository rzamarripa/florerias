import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Package,
  Pencil,
  Check,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useCartStore } from "../store/cartStore";
import { ecommerceConfigService } from "../services/ecommerceConfig";
import { toast } from "react-toastify";

interface CartModalProps {
  branchId?: string;
  onProductsSaved?: () => void;
}

const CartModal: React.FC<CartModalProps> = ({ branchId: propBranchId, onProductsSaved }) => {
  const {
    items,
    isOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    updatePrice,
    clearCart,
    getTotalPrice,
    getAvailableStock,
  } = useCartStore();

  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);
  const [branchId, setBranchId] = useState<string>("");
  const [configId, setConfigId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Usar branchId de prop o obtenerlo
  useEffect(() => {
    const getConfigData = async () => {
      try {
        const configResponse = await ecommerceConfigService.getManagerConfig();
        const branch = configResponse.data.branch;
        const config = configResponse.data.config;

        if (branch?._id) {
          setBranchId(branch._id);
        }

        // Si existe config, usar su ID
        if (config?._id) {
          setConfigId(config._id);
          console.log("Configuracion encontrada:", config._id);
        } else if (branch?._id) {
          // Si no existe config pero hay branch, podemos crear una nueva cuando guardemos
          console.log("No hay configuracion, se creara al guardar");
          setConfigId(null);
        }
      } catch (error) {
        console.error("Error al obtener configuracion:", error);
      }
    };

    if (propBranchId) {
      setBranchId(propBranchId);
    }
    getConfigData();
  }, [propBranchId]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(price);
  };

  const handleQuantityChange = (
    productId: string,
    currentQuantity: number,
    delta: number,
    maxStock: number
  ) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity >= 1 && newQuantity <= maxStock) {
      updateQuantity(productId, newQuantity);
    }
  };

  const startEditPrice = (productId: string, currentPrice: number) => {
    setEditingPrice(productId);
    setTempPrice(currentPrice);
  };

  const savePrice = (productId: string) => {
    if (tempPrice > 0) {
      updatePrice(productId, tempPrice);
      toast.success("Precio actualizado");
    } else {
      toast.error("El precio debe ser mayor a 0");
    }
    setEditingPrice(null);
  };

  const cancelEditPrice = () => {
    setEditingPrice(null);
    setTempPrice(0);
  };

  const handleSaveToEcommerce = async () => {
    if (!branchId) {
      toast.error("No se pudo obtener la informacion de la sucursal");
      return;
    }

    setSaving(true);
    try {
      // Obtener la configuracion actual
      const configResponse = await ecommerceConfigService.getManagerConfig();
      const config = configResponse.data.config;
      const companyId = configResponse.data.companyId;

      let currentConfigId = configId;
      let currentItemsStock = config?.itemsStock || [];

      // Si no existe configuracion, crearla primero
      if (!config || !currentConfigId) {
        console.log("Creando nueva configuracion para la sucursal");
        const newConfig = await ecommerceConfigService.createConfig({
          companyId: companyId,
          branchId: branchId,
          itemsStock: []
        });
        currentConfigId = newConfig._id;
        setConfigId(currentConfigId);
        currentItemsStock = [];
      }

      // Crear un mapa de los items existentes por productId
      const existingItemsMap = new Map(
        currentItemsStock.map((item: any) => [item.productId || item._id, item])
      );

      // Preparar los nuevos items o actualizar existentes
      items.forEach(item => {
        const itemToSave = {
          _id: item._id,
          productId: item._id,
          nombre: item.nombre,
          descripcion: item.descripcion || "",
          precio: item.precioEditado || item.precio,
          stock: item.quantity, // Usar quantity como el nuevo stock
          imagen: item.imagen || "",
          productCategory: item.productCategory,
          originalPrice: item.precio,
          discountPercentage: item.precioEditado && item.precioEditado < item.precio
            ? Math.round(((item.precio - item.precioEditado) / item.precio) * 100)
            : 0
        };

        // Si el producto ya existe, actualizar cantidad y precio
        if (existingItemsMap.has(item._id)) {
          const existingItem = existingItemsMap.get(item._id);
          itemToSave.stock = existingItem.stock + item.quantity; // Sumar al stock existente
        }

        existingItemsMap.set(item._id, itemToSave);
      });

      // Convertir el mapa de vuelta a array
      const finalItemsStock = Array.from(existingItemsMap.values());

      // Actualizar en la base de datos y descontar del storage (solo lo necesario)
      await ecommerceConfigService.updateItemsStock(currentConfigId, finalItemsStock, true, false); // deductFromStorage=true, transferAll=false

      toast.success("Productos actualizados en el catalogo de e-commerce y stock descontado del almacen");
      clearCart();
      closeCart();

      // Recargar los datos para reflejar el nuevo stock
      if (onProductsSaved) {
        onProductsSaved();
      }
    } catch (error) {
      console.error("Error al guardar productos:", error);
      toast.error("Error al guardar los productos en el catalogo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            Catalogo de Productos de e-comerce
            {items.length > 0 && (
              <Badge className="ml-2">{items.length}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-3" />
              <h5 className="text-lg font-medium">Tu carrito esta vacio</h5>
              <p className="text-muted-foreground">Agrega productos desde el catalogo</p>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((item) => (
                <div key={item._id} className="py-4">
                  <div className="flex items-center gap-4">
                    {/* Product Image */}
                    <div
                      className="flex-shrink-0 w-20 h-20 bg-muted rounded-lg flex items-center justify-center"
                    >
                      {item.imagen ? (
                        <img
                          src={item.imagen}
                          alt={item.nombre}
                          className="w-[70px] h-[70px] object-contain"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-grow min-w-0">
                      <h6 className="font-medium mb-1 truncate">{item.nombre}</h6>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {editingPrice === item._id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              className="w-24 h-8"
                              value={tempPrice}
                              onChange={(e) =>
                                setTempPrice(parseFloat(e.target.value) || 0)
                              }
                              step="0.01"
                              min="0"
                            />
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => savePrice(item._id)}
                              className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={cancelEditPrice}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-primary font-bold">
                              {formatPrice(item.precioEditado || item.precio)}
                            </span>
                            {item.precioEditado &&
                              item.precioEditado !== item.precio && (
                                <small className="text-muted-foreground line-through">
                                  {formatPrice(item.precio)}
                                </small>
                              )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                startEditPrice(
                                  item._id,
                                  item.precioEditado || item.precio
                                )
                              }
                              className="h-6 w-6 p-0 ml-1"
                              title="Editar precio"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        <Badge variant="default" className="bg-green-600">
                          Cantidad: {item.quantity}
                        </Badge>
                        <Badge variant="secondary">
                          Disponible: {getAvailableStock(item._id) || item.stock}
                        </Badge>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border rounded-md">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleQuantityChange(
                                item._id,
                                item.quantity,
                                -1,
                                item.stock
                              )
                            }
                            disabled={item.quantity <= 1}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val) && val >= 1 && val <= item.stock) {
                                updateQuantity(item._id, val);
                              }
                            }}
                            className="w-14 h-8 text-center rounded-none focus-visible:ring-0"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleQuantityChange(
                                item._id,
                                item.quantity,
                                1,
                                item.stock
                              )
                            }
                            disabled={item.quantity >= item.stock}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        <span className="text-muted-foreground text-sm">
                          Subtotal:{" "}
                          <strong className="text-foreground">
                            {formatPrice(
                              (item.precioEditado || item.precio) * item.quantity
                            )}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFromCart(item._id)}
                      className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <DialogFooter className="flex-col sm:flex-col gap-3 border-t pt-4">
            <div className="flex justify-between items-center w-full">
              <h5 className="font-medium">Total:</h5>
              <h4 className="text-primary text-xl font-bold">
                {formatPrice(getTotalPrice())}
              </h4>
            </div>
            <div className="flex gap-2 w-full">
              <Button
                variant="destructive"
                onClick={clearCart}
                className="flex-1"
              >
                Limpiar stock de almacen
              </Button>
              <Button
                onClick={handleSaveToEcommerce}
                className="flex-1"
                disabled={saving || !branchId}
              >
                {saving ? "Guardando..." : "Guardar en catalogo e-commerce"}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CartModal;
