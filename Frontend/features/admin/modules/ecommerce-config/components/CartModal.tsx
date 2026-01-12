import { useState, useEffect } from "react";
import {
  Modal,
  Button,
  ListGroup,
  Badge,
  InputGroup,
  Form,
  Image,
} from "react-bootstrap";
import {
  TbShoppingCart,
  TbTrash,
  TbPlus,
  TbMinus,
  TbPackage,
  TbPencil,
  TbCheck,
  TbX,
} from "react-icons/tb";
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
          console.log("Configuración encontrada:", config._id);
        } else if (branch?._id) {
          // Si no existe config pero hay branch, podemos crear una nueva cuando guardemos
          console.log("No hay configuración, se creará al guardar");
          setConfigId(null);
        }
      } catch (error) {
        console.error("Error al obtener configuración:", error);
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

  return (
    <Modal show={isOpen} onHide={closeCart} size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          <TbShoppingCart size={24} />
          Catalogo de Productos de e-comerce
          {items.length > 0 && (
            <Badge bg="primary" pill>
              {items.length}
            </Badge>
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {items.length === 0 ? (
          <div className="text-center py-5">
            <TbShoppingCart size={64} className="text-muted mb-3" />
            <h5>Tu carrito está vacío</h5>
            <p className="text-muted">Agrega productos desde el catálogo</p>
          </div>
        ) : (
          <ListGroup variant="flush">
            {items.map((item) => (
              <ListGroup.Item key={item._id} className="py-3">
                <div className="d-flex align-items-center gap-3">
                  {/* Product Image */}
                  <div
                    className="flex-shrink-0"
                    style={{
                      width: "80px",
                      height: "80px",
                      backgroundColor: "#f8f9fa",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.imagen ? (
                      <Image
                        src={item.imagen}
                        alt={item.nombre}
                        width={70}
                        height={70}
                        style={{ objectFit: "contain" }}
                      />
                    ) : (
                      <TbPackage size={32} className="text-muted" />
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-grow-1">
                    <h6 className="mb-1">{item.nombre}</h6>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      {editingPrice === item._id ? (
                        <div className="d-flex align-items-center gap-1">
                          <Form.Control
                            type="number"
                            size="sm"
                            value={tempPrice}
                            onChange={(e) =>
                              setTempPrice(parseFloat(e.target.value) || 0)
                            }
                            style={{ width: "100px" }}
                            step="0.01"
                            min="0"
                          />
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => savePrice(item._id)}
                            className="p-1"
                          >
                            <TbCheck size={16} />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={cancelEditPrice}
                            className="p-1"
                          >
                            <TbX size={16} />
                          </Button>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center gap-1">
                          <span className="text-primary fw-bold">
                            {formatPrice(item.precioEditado || item.precio)}
                          </span>
                          {item.precioEditado &&
                            item.precioEditado !== item.precio && (
                              <small className="text-muted text-decoration-line-through">
                                {formatPrice(item.precio)}
                              </small>
                            )}
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() =>
                              startEditPrice(
                                item._id,
                                item.precioEditado || item.precio
                              )
                            }
                            className="p-0 ms-1 text-secondary"
                            title="Editar precio"
                          >
                            <TbPencil size={14} />
                          </Button>
                        </div>
                      )}
                      <Badge bg="success" className="ms-2">
                        Cantidad: {item.quantity}
                      </Badge>
                      <Badge bg="light" text="dark" className="ms-1">
                        Disponible: {getAvailableStock(item._id) || item.stock}
                      </Badge>
                    </div>

                    {/* Quantity Controls */}
                    <div className="d-flex align-items-center gap-3">
                      <InputGroup size="sm" style={{ width: "130px" }}>
                        <Button
                          variant="outline-secondary"
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
                        >
                          <TbMinus size={14} />
                        </Button>
                        <Form.Control
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val >= 1 && val <= item.stock) {
                              updateQuantity(item._id, val);
                            }
                          }}
                          className="text-center"
                          style={{ maxWidth: "60px" }}
                        />
                        <Button
                          variant="outline-secondary"
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
                        >
                          <TbPlus size={14} />
                        </Button>
                      </InputGroup>

                      <span className="text-muted">
                        Subtotal:{" "}
                        <strong>
                          {formatPrice(
                            (item.precioEditado || item.precio) * item.quantity
                          )}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removeFromCart(item._id)}
                    className="flex-shrink-0"
                  >
                    <TbTrash size={18} />
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>
      {items.length > 0 && (
        <Modal.Footer>
          <div className="w-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Total:</h5>
              <h4 className="text-primary mb-0">
                {formatPrice(getTotalPrice())}
              </h4>
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="danger"
                onClick={clearCart}
                className="flex-fill"
              >
                Limpiar stock de almacen
              </Button>
              <Button
                variant="primary"
                className="flex-fill"
                disabled={saving || !branchId}
                onClick={async () => {
                  if (!branchId) {
                    toast.error("No se pudo obtener la información de la sucursal");
                    return;
                  }
                  
                  setSaving(true);
                  try {
                    // Obtener la configuración actual
                    const configResponse = await ecommerceConfigService.getManagerConfig();
                    const config = configResponse.data.config;
                    const companyId = configResponse.data.companyId;
                    
                    let currentConfigId = configId;
                    let currentItemsStock = config?.itemsStock || [];
                    
                    // Si no existe configuración, crearla primero
                    if (!config || !currentConfigId) {
                      console.log("Creando nueva configuración para la sucursal");
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
                    
                    toast.success("Productos actualizados en el catálogo de e-commerce y stock descontado del almacén");
                    clearCart();
                    closeCart();
                    
                    // Recargar los datos para reflejar el nuevo stock
                    if (onProductsSaved) {
                      onProductsSaved();
                    }
                  } catch (error) {
                    console.error("Error al guardar productos:", error);
                    toast.error("Error al guardar los productos en el catálogo");
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Guardando..." : "Guardar en catálogo e-commerce"}
              </Button>
            </div>
          </div>
        </Modal.Footer>
      )}
    </Modal>
  );
};

export default CartModal;
