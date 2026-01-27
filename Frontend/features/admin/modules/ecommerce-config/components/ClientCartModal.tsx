import React, { useState } from "react";
import {
  X,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "../store/cartStore";
import { toast } from "react-toastify";

interface ClientCartModalProps {
  colors?: any;
  typography?: any;
}

const ClientCartModal: React.FC<ClientCartModalProps> = ({
  colors,
  typography,
}) => {
  const [processingOrder, setProcessingOrder] = useState(false);
  const [customerData, setCustomerData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  const {
    items,
    isOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getAvailableStock,
  } = useCartStore();

  const totalPrice = getTotalPrice();

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = async () => {
    // Validar datos del cliente
    if (!customerData.name || !customerData.phone) {
      toast.error("Por favor ingresa tu nombre y teléfono");
      return;
    }

    if (items.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    try {
      setProcessingOrder(true);
      
      // Aquí iría la lógica para procesar la orden
      // Por ahora solo simulamos el proceso
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("¡Orden procesada exitosamente! Te contactaremos pronto.");
      clearCart();
      closeCart();
      setCustomerData({
        name: "",
        phone: "",
        email: "",
        address: "",
        notes: "",
      });
    } catch (error) {
      toast.error("Error al procesar la orden");
    } finally {
      setProcessingOrder(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Tu Carrito
          </SheetTitle>
          <SheetDescription>
            {items.length === 0
              ? "Tu carrito está vacío"
              : `${items.length} producto(s) en tu carrito`}
          </SheetDescription>
        </SheetHeader>

        {items.length > 0 && (
          <>
            <div className="mt-6 space-y-4">
              {items.map((item) => (
                <div
                  key={item._id}
                  className="flex gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  {/* Product Image */}
                  <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0">
                    {item.imagen ? (
                      <img
                        src={item.imagen}
                        alt={item.nombre}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{item.nombre}</h4>
                    <p className="text-sm text-gray-600">
                      ${item.precio.toFixed(2)} c/u
                    </p>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-8 text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                        disabled={item.quantity >= getAvailableStock(item._id) + item.quantity}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 ml-auto text-red-500 hover:text-red-700"
                        onClick={() => removeFromCart(item._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right">
                    <p className="font-semibold">
                      ${(item.precio * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-6" />

            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Información de Contacto</h3>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    placeholder="Tu nombre completo"
                    value={customerData.name}
                    onChange={(e) =>
                      setCustomerData({ ...customerData, name: e.target.value })
                    }
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Tu número de teléfono"
                    value={customerData.phone}
                    onChange={(e) =>
                      setCustomerData({ ...customerData, phone: e.target.value })
                    }
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email (opcional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={customerData.email}
                    onChange={(e) =>
                      setCustomerData({ ...customerData, email: e.target.value })
                    }
                  />
                </div>
                
                <div>
                  <Label htmlFor="address">Dirección de entrega</Label>
                  <Input
                    id="address"
                    placeholder="Tu dirección completa"
                    value={customerData.address}
                    onChange={(e) =>
                      setCustomerData({ ...customerData, address: e.target.value })
                    }
                  />
                </div>
                
                <div>
                  <Label htmlFor="notes">Notas adicionales</Label>
                  <Input
                    id="notes"
                    placeholder="Instrucciones especiales..."
                    value={customerData.notes}
                    onChange={(e) =>
                      setCustomerData({ ...customerData, notes: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Order Summary */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Envío</span>
                <span className="text-green-600">Gratis</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span style={{ color: colors?.primary || "#6366f1" }}>
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={processingOrder}
                style={{ backgroundColor: colors?.primary || "#6366f1" }}
              >
                {processingOrder ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Realizar Pedido
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={closeCart}
              >
                Seguir Comprando
              </Button>
            </div>
          </>
        )}

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">No hay productos en tu carrito</p>
            <Button onClick={closeCart}>Explorar Productos</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ClientCartModal;