"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Store, Package, CreditCard, Search } from "lucide-react";
import { ordersService } from "./services/orders";
import { CreateOrderData, OrderItem } from "./types";
import ProductCatalog from "./components/ProductCatalog";
import AddExtrasModal from "./components/AddExtrasModal";
import CartSection from "./components/CartSection";
import OrderDetailsModal from "./components/OrderDetailsModal";
import DiscountAuthModal from "./components/DiscountAuthModal";
import { paymentMethodsService } from "@/features/admin/modules/payment-methods/services/paymentMethods";
import { PaymentMethod } from "@/features/admin/modules/payment-methods/types";
import { branchesService } from "@/features/admin/modules/branches/services/branches";
import { Branch } from "@/features/admin/modules/branches/types";
import { cashRegistersService } from "@/features/admin/modules/cash-registers/services/cashRegisters";
import { CashRegister } from "@/features/admin/modules/cash-registers/types";
import { storageService } from "@/features/admin/modules/storage/services/storage";
import { Storage } from "@/features/admin/modules/storage/types";
import { toast } from "react-toastify";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { companiesService } from "@/features/admin/modules/companies/services/companies";
import { generateSaleTicket, SaleTicketData } from "./utils/generateSaleTicket";
import { generateDeliveryTicket, DeliveryTicketData } from "./utils/generateDeliveryTicket";
import { uploadComprobante, uploadArreglo, uploadSaleTicket, uploadDeliveryTicket } from "@/services/firebaseStorage";
import { useStorageSocket, StockUpdatePayload } from "@/hooks/useStorageSocket";
import QRScanner from "@/features/admin/modules/digitalCards/components/QRScanner";
import ClientPointsDashboardModal from "@/features/admin/modules/clients/components/ClientPointsDashboardModal";
import { createTicket } from "./services/tickets";
import WhatsAppTicketModal from "./components/WhatsAppTicketModal";

const NewOrderPage = () => {
  const { getIsCashier, getIsSocialMedia } = useUserRoleStore();
  const { user } = useUserSessionStore();
  const isCashier = getIsCashier();
  const isSocialMedia = getIsSocialMedia();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [companyBranches, setCompanyBranches] = useState<Branch[]>([]); // Para usuarios Redes
  const [loadingCompanyBranches, setLoadingCompanyBranches] = useState(false);
  const [cashRegister, setCashRegister] = useState<CashRegister | null>(null);
  const [loadingCashRegister, setLoadingCashRegister] = useState(false);
  const [togglingCashRegister, setTogglingCashRegister] = useState(false);
  const [availableCashRegisters, setAvailableCashRegisters] = useState<
    CashRegister[]
  >([]);
  const [loadingAvailableCashRegisters, setLoadingAvailableCashRegisters] =
    useState(false);
  const [selectedCashRegisterId, setSelectedCashRegisterId] =
    useState<string>("");
  const [storage, setStorage] = useState<Storage | null>(null);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [selectedStorageId, setSelectedStorageId] = useState<string>("");
  const [hasNoStorage, setHasNoStorage] = useState(false);
  const [showDiscountRequestDialog, setShowDiscountRequestDialog] =
    useState(false);
  const [discountRequestMessage, setDiscountRequestMessage] = useState("");
  const [hasPendingDiscountAuth, setHasPendingDiscountAuth] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [showAddExtrasModal, setShowAddExtrasModal] = useState(false);
  const [selectedItemIndexForExtras, setSelectedItemIndexForExtras] =
    useState<number>(-1);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [catalogSearchTerm, setCatalogSearchTerm] = useState("");
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showPointsDashboard, setShowPointsDashboard] = useState(false);
  const [scannedClientData, setScannedClientData] = useState<any>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppTicketData, setWhatsAppTicketData] = useState<{
    orderNumber: string;
    clientName: string;
    clientPhone: string;
    ticketUrl: string;
    ticketType: 'sale' | 'delivery';
  } | null>(null);

  const [formData, setFormData] = useState<CreateOrderData>({
    branchId: "",
    cashRegisterId: null,
    clientInfo: {
      name: "",
      phone: "",
      email: "",
    },
    salesChannel: "tienda",
    items: [],
    shippingType: "tienda",
    anonymous: false,
    quickSale: false,
    deliveryData: {
      recipientName: "",
      deliveryDateTime: "",
      message: "",
      street: "",
      neighborhoodId: "",
      deliveryPrice: 0,
      reference: "",
    },
    paymentMethod: "",
    discount: 0,
    discountType: "porcentaje",
    subtotal: 0,
    total: 0,
    advance: 0,
    paidWith: 0,
    change: 0,
    remainingBalance: 0,
    sendToProduction: false,
    isSocialMediaOrder: false,
    socialMedia: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Callback para manejar actualizaciones de stock en tiempo real desde otras sesiones
  const handleStockUpdated = React.useCallback(
    (data: StockUpdatePayload) => {
      if (!storage) return;

      console.log(
        `📦 [NewOrderPage] Stock actualizado por orden ${data.orderNumber}`
      );

      // Crear copia del storage para actualizar
      const updatedStorage = { ...storage };
      let hasChanges = false;

      // Actualizar productos
      if (data.productsUpdated && data.productsUpdated.length > 0) {
        updatedStorage.products = [...updatedStorage.products];
        for (const productUpdate of data.productsUpdated) {
          const productIndex = updatedStorage.products.findIndex(
            (p: any) => p.productId._id === productUpdate.productId
          );
          if (productIndex !== -1) {
            updatedStorage.products[productIndex] = {
              ...updatedStorage.products[productIndex],
              quantity: productUpdate.newQuantity,
            };
            hasChanges = true;
          }
        }
      }

      // Actualizar materiales
      if (data.materialsUpdated && data.materialsUpdated.length > 0) {
        updatedStorage.materials = [...(updatedStorage.materials || [])];
        for (const materialUpdate of data.materialsUpdated) {
          const materialIndex = updatedStorage.materials.findIndex(
            (m: any) => m.materialId._id === materialUpdate.materialId
          );
          if (materialIndex !== -1) {
            updatedStorage.materials[materialIndex] = {
              ...updatedStorage.materials[materialIndex],
              quantity: materialUpdate.newQuantity,
            };
            hasChanges = true;
          }
        }
      }

      if (hasChanges) {
        setStorage(updatedStorage as any);
        toast.info(`Stock actualizado por orden ${data.orderNumber}`, {
          autoClose: 3000,
        });
      }
    },
    [storage]
  );

  // Hook para escuchar actualizaciones de stock en tiempo real
  useStorageSocket({
    storageId: storage?._id || null,
    onStockUpdated: handleStockUpdated,
  });

  // Obtener todos los métodos de pago (necesario para el ticket y reset form)
  const fetchPaymentMethods = async () => {
    try {
      const response = await paymentMethodsService.getAllPaymentMethods({
        limit: 1000,
        status: true,
      });
      setPaymentMethods(response.data);
    } catch (err) {
      console.error("Error al cargar métodos de pago:", err);
    }
  };

  // Obtener sucursales del usuario Cajero
  const fetchUserBranches = async () => {
    setLoadingBranches(true);
    try {
      const response = await branchesService.getUserBranches();
      setBranches(response.data);
      // Establecer la primera sucursal como predeterminada
      if (response.data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          branchId: response.data[0]._id,
        }));
      }
    } catch (err) {
      console.error("Error al cargar sucursales:", err);
      toast.error("Error al cargar las sucursales del usuario");
    } finally {
      setLoadingBranches(false);
    }
  };

  // Obtener sucursales de la empresa para usuario Redes
  const fetchCompanyBranches = async () => {
    setLoadingCompanyBranches(true);
    try {
      const response = await companiesService.getRedesUserBranches();
      setCompanyBranches(response.data);
      // NO establecer automáticamente una sucursal - el usuario debe seleccionar
    } catch (err) {
      console.error("Error al cargar sucursales de la empresa:", err);
      toast.error("Error al cargar las sucursales de tu empresa");
    } finally {
      setLoadingCompanyBranches(false);
    }
  };

  // Obtener caja registradora del usuario
  const fetchUserCashRegister = async () => {
    setLoadingCashRegister(true);
    try {
      const response = await cashRegistersService.getUserCashRegister();
      if (response.data) {
        setCashRegister(response.data);
        setFormData((prev) => ({
          ...prev,
          cashRegisterId: response.data!._id,
        }));
      } else {
        setCashRegister(null);
        setFormData((prev) => ({
          ...prev,
          cashRegisterId: null,
        }));
      }
    } catch (err) {
      console.error("Error al cargar caja registradora:", err);
      toast.error("Error al cargar la caja registradora del usuario");
    } finally {
      setLoadingCashRegister(false);
    }
  };

  // Obtener almacén por sucursal
  const fetchStorageByBranch = async (branchId: string) => {
    setLoadingStorage(true);
    setHasNoStorage(false);
    try {
      const response = await storageService.getStorageByBranch(branchId);
      if (response.data) {
        setStorage(response.data);
        setSelectedStorageId(response.data._id);
        setHasNoStorage(false);
      } else {
        setStorage(null);
        setSelectedStorageId("");
        setHasNoStorage(true);
      }
    } catch (err: any) {
      console.error("Error al cargar almacén:", err);
      setStorage(null);
      setSelectedStorageId("");
      setHasNoStorage(true);
    } finally {
      setLoadingStorage(false);
    }
  };

  // Cargar métodos de pago, sucursales y caja registradora al montar el componente
  useEffect(() => {
    fetchPaymentMethods();

    // Para usuarios Redes, cargar sucursales de su empresa
    if (isSocialMedia) {
      fetchCompanyBranches();
    } else {
      // Para usuarios Cajero, cargar sus sucursales asignadas
      fetchUserBranches();
    }

    fetchUserCashRegister();
  }, [isSocialMedia]);

  // Configurar valores iniciales para usuarios de Redes
  useEffect(() => {
    if (isSocialMedia) {
      setFormData((prev) => ({
        ...prev,
        shippingType: "redes_sociales",
        isSocialMediaOrder: true,
        socialMedia: "whatsapp", // Valor por defecto
        salesChannel: "whatsapp", // Sincronizar con socialMedia
      }));
    }
  }, [isSocialMedia]);

  // Cargar storage cuando cambia la sucursal
  useEffect(() => {
    if (formData.branchId) {
      fetchStorageByBranch(formData.branchId);
    } else {
      setStorage(null);
      setSelectedStorageId("");
      setHasNoStorage(false);
    }
  }, [formData.branchId]);

  // Función para manejar cambio de sucursal por usuario Redes
  // Obtener cajas de redes sociales disponibles para una sucursal
  const fetchAvailableCashRegisters = async (branchId: string) => {
    if (!branchId) {
      setAvailableCashRegisters([]);
      return;
    }

    setLoadingAvailableCashRegisters(true);
    try {
      const response =
        await cashRegistersService.getSocialMediaCashRegistersByBranch(
          branchId
        );
      if (response.success) {
        setAvailableCashRegisters(response.data);

        // Si el usuario tiene una caja abierta y esa caja pertenece a esta sucursal, seleccionarla automáticamente
        if (
          cashRegister &&
          cashRegister.isOpen &&
          cashRegister.branchId?._id === branchId
        ) {
          const userCashInBranch = response.data.find(
            (cr: CashRegister) => cr._id === cashRegister._id
          );
          if (userCashInBranch) {
            setSelectedCashRegisterId(cashRegister._id);
            setFormData((prev) => ({
              ...prev,
              cashRegisterId: cashRegister._id,
            }));
          }
        }
      }
    } catch (err: any) {
      console.error("Error al obtener cajas de redes sociales:", err);
      toast.error("Error al cargar las cajas disponibles");
      setAvailableCashRegisters([]);
    } finally {
      setLoadingAvailableCashRegisters(false);
    }
  };

  const handleBranchChange = (branchId: string) => {
    setFormData((prev) => ({
      ...prev,
      branchId: branchId,
      cashRegisterId: null, // Limpiar la caja seleccionada al cambiar de sucursal
    }));
    setSelectedCashRegisterId(""); // Limpiar selector de caja

    // Para usuarios Redes, cargar cajas disponibles de la sucursal
    if (isSocialMedia && branchId) {
      fetchAvailableCashRegisters(branchId);
    }
  };

  // Manejar selección de caja registradora
  const handleCashRegisterSelect = (cashRegisterId: string) => {
    setSelectedCashRegisterId(cashRegisterId);
    setFormData((prev) => ({
      ...prev,
      cashRegisterId: cashRegisterId || null,
    }));
  };

  // Abrir caja registradora seleccionada
  const handleOpenCashRegister = async () => {
    if (!selectedCashRegisterId) {
      toast.error("Debes seleccionar una caja primero");
      return;
    }

    setTogglingCashRegister(true);
    try {
      const response = await cashRegistersService.toggleOpen(
        selectedCashRegisterId,
        true
      );

      if (response.success) {
        toast.success("Caja abierta exitosamente");
        // Recargar cajas disponibles para actualizar estados
        if (formData.branchId) {
          await fetchAvailableCashRegisters(formData.branchId);
        }
        // Actualizar la caja del usuario
        await fetchUserCashRegister();
      }
    } catch (err: any) {
      console.error("Error al abrir caja:", err);
      toast.error(err.message || "Error al abrir la caja");
    } finally {
      setTogglingCashRegister(false);
    }
  };

  // Actualizar fecha y hora cuando se activa "Venta Rápida"
  useEffect(() => {
    if (formData.quickSale) {
      // Obtener fecha y hora actual en formato ISO para datetime-local
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const currentDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

      setFormData((prev) => ({
        ...prev,
        deliveryData: {
          ...prev.deliveryData,
          deliveryDateTime: currentDateTime,
        },
      }));
    }
  }, [formData.quickSale]);

  // Abrir/Cerrar caja registradora
  const handleToggleCashRegister = async () => {
    if (!cashRegister) return;

    setTogglingCashRegister(true);
    try {
      const response = await cashRegistersService.toggleOpen(
        cashRegister._id,
        !cashRegister.isOpen
      );

      if (response.success) {
        setCashRegister(response.data);
        toast.success(response.message);
      }
    } catch (err: any) {
      console.error("Error al cambiar estado de caja:", err);
      toast.error(err.message || "Error al cambiar estado de la caja");
    } finally {
      setTogglingCashRegister(false);
    }
  };

  // Función helper para recalcular totales incluyendo precio de envío
  const recalculateTotals = (
    items: OrderItem[],
    discount: number,
    discountType: "porcentaje" | "cantidad",
    deliveryPrice: number,
    advance: number
  ) => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount =
      discountType === "porcentaje" ? (subtotal * discount) / 100 : discount;
    const total = subtotal - discountAmount + deliveryPrice;

    return {
      subtotal,
      total,
      remainingBalance: total - advance,
    };
  };

  // Agregar item manual a la lista (recibido desde CartSection)
  const handleAddManualItem = (newItem: OrderItem) => {
    const updatedItems = [...formData.items, newItem];
    const totals = recalculateTotals(
      updatedItems,
      formData.discount || 0,
      formData.discountType || "porcentaje",
      formData.deliveryData.deliveryPrice || 0,
      formData.advance || 0
    );

    setFormData({
      ...formData,
      items: updatedItems,
      ...totals,
    });

    toast.success("Producto agregado");
  };

  // Eliminar item
  const handleRemoveItem = async (index: number) => {
    const itemToRemove = formData.items[index];

    // Si es un producto del catálogo, restaurar el stock LOCAL (solo visual)
    // El stock real no fue modificado - se descuenta solo al crear la orden
    if (itemToRemove.isProduct && itemToRemove.productId && storage) {
      const updatedStorage = { ...storage };
      const productIndex = updatedStorage.products.findIndex(
        (p: any) => p.productId._id === itemToRemove.productId
      );
      if (productIndex !== -1) {
        updatedStorage.products = [...updatedStorage.products];
        updatedStorage.products[productIndex] = {
          ...updatedStorage.products[productIndex],
          quantity:
            updatedStorage.products[productIndex].quantity +
            itemToRemove.quantity,
        };
        setStorage(updatedStorage as any);
      }
    }

    const updatedItems = formData.items.filter((_, i) => i !== index);
    const totals = recalculateTotals(
      updatedItems,
      formData.discount || 0,
      formData.discountType || "porcentaje",
      formData.deliveryData.deliveryPrice || 0,
      formData.advance || 0
    );

    setFormData({
      ...formData,
      items: updatedItems,
      ...totals,
    });

    toast.success("Producto eliminado");
  };

  // Abrir modal de extras para un item específico
  const handleOpenExtrasModal = (index: number) => {
    if (!storage) {
      toast.error("No hay almacén configurado");
      return;
    }

    setSelectedItemIndexForExtras(index);
    setShowAddExtrasModal(true);
  };

  // Agregar extras (materiales) a un item específico
  const handleAddExtras = async (
    extras: {
      materialId: string;
      name: string;
      price: number;
      quantity: number;
    }[]
  ) => {
    if (
      selectedItemIndexForExtras < 0 ||
      selectedItemIndexForExtras >= formData.items.length
    ) {
      toast.error("Item no válido");
      return;
    }

    if (!storage) {
      toast.error("No hay almacén configurado");
      return;
    }

    // NO descontamos materiales aquí - se descontarán al crear la orden en el backend
    // Agregar los materiales como insumos al item seleccionado
    const updatedItems = [...formData.items];
    const currentItem = updatedItems[selectedItemIndexForExtras];

    const newInsumos = extras.map((extra) => ({
      materialId: extra.materialId, // Guardamos el ID para descontar en el backend
      nombre: extra.name,
      cantidad: extra.quantity,
      importeVenta: extra.price * extra.quantity,
      isExtra: true,
    }));

    // Agregar los nuevos insumos a los existentes
    currentItem.insumos = [...(currentItem.insumos || []), ...newInsumos];

    // Recalcular el amount del item incluyendo solo los insumos extras
    const insumosTotal = currentItem.insumos.reduce(
      (sum, insumo) => sum + (insumo.isExtra ? insumo.importeVenta : 0),
      0
    );
    currentItem.amount =
      currentItem.unitPrice * currentItem.quantity + insumosTotal;

    // Actualizar el formData con los items actualizados
    updatedItems[selectedItemIndexForExtras] = currentItem;

    // Recalcular totales
    const totals = recalculateTotals(
      updatedItems,
      formData.discount || 0,
      formData.discountType || "porcentaje",
      formData.deliveryData.deliveryPrice || 0,
      formData.advance || 0
    );

    setFormData({
      ...formData,
      items: updatedItems,
      ...totals,
    });

    toast.success("Extras agregados exitosamente");
  };

  // Manejar cambio de descuento
  const handleDiscountChange = (
    value: number,
    tipo: "porcentaje" | "cantidad"
  ) => {
    const totals = recalculateTotals(
      formData.items,
      value,
      tipo,
      formData.deliveryData.deliveryPrice || 0,
      formData.advance || 0
    );

    setFormData({
      ...formData,
      discount: value,
      discountType: tipo,
      ...totals,
    });
  };

  // Manejar cambio de anticipo
  const handleAdvanceChange = (value: number) => {
    const advance = isNaN(value) ? 0 : value;
    const remainingBalance = formData.total - advance;
    // Cambio = Pagó con - Anticipo
    const changeAmount = (formData.paidWith || 0) - advance;

    setFormData({
      ...formData,
      advance: advance,
      remainingBalance: remainingBalance,
      change: changeAmount > 0 ? changeAmount : 0,
    });
  };

  // Manejar cambio de pago con
  const handlePaidWithChange = (value: number) => {
    const paidWith = isNaN(value) ? 0 : value;
    const remainingBalance = formData.total - (formData.advance || 0);
    // Cambio = Pagó con - Anticipo
    const changeAmount = paidWith - (formData.advance || 0);

    setFormData({
      ...formData,
      paidWith: paidWith,
      change: changeAmount > 0 ? changeAmount : 0,
    });
  };

  // Manejar solicitud de permiso de descuento - Nueva lógica: aplicar descuento inmediatamente
  const handleRequestDiscountAuth = async () => {
    if (!discountRequestMessage.trim()) {
      toast.error("Por favor ingresa un mensaje de solicitud");
      return;
    }

    const discountValue = parseFloat(formData.discount?.toString() || "0");
    if (discountValue <= 0) {
      toast.error("El valor del descuento debe ser mayor a 0");
      return;
    }

    // Aplicar el descuento inmediatamente al formulario
    const discountType = formData.discountType || "porcentaje";
    const discountAmount =
      discountType === "porcentaje"
        ? (formData.subtotal * discountValue) / 100
        : discountValue;

    const totals = recalculateTotals(
      formData.items,
      discountValue,
      discountType,
      formData.deliveryData.deliveryPrice || 0,
      formData.advance || 0
    );

    setFormData({
      ...formData,
      discount: discountValue,
      discountType: discountType,
      ...totals,
    });

    // Marcar que hay un descuento pendiente de autorización
    setHasPendingDiscountAuth(true);
    setShowDiscountRequestDialog(false);

    toast.success(
      "Descuento aplicado. Se creará la solicitud al guardar la orden."
    );
  };

  // Agregar producto desde catálogo
  const handleAddProductFromCatalog = async (
    product: any,
    quantity: number
  ) => {
    // Validar que haya un storage seleccionado
    if (!storage) {
      toast.error(
        "No hay almacén asignado a esta sucursal. No puedes agregar productos del catálogo sin stock disponible."
      );
      return;
    }

    // Buscar el producto en el storage para verificar stock
    const productInStorage = storage.products.find(
      (p: any) => p.productId._id === product._id
    );

    if (!productInStorage) {
      toast.error(
        `El producto "${product.nombre}" no está disponible en este almacén`
      );
      return;
    }

    // Calcular cantidad ya agregada de este producto en la orden
    const quantityInOrder = formData.items
      .filter((item) => item.productId === product._id)
      .reduce((sum, item) => sum + item.quantity, 0);

    const totalRequested = quantityInOrder + quantity;

    if (totalRequested > productInStorage.quantity) {
      toast.error(
        `Stock insuficiente. Disponible: ${productInStorage.quantity}, Ya en orden: ${quantityInOrder}, Solicitado: ${quantity}`
      );
      return;
    }

    // Actualizar el storage LOCAL para reflejar la reducción de stock (solo visual)
    // El stock real se descuenta en el backend al crear la orden
    const updatedStorage = { ...storage };
    const productIndex = updatedStorage.products.findIndex(
      (p: any) => p.productId._id === product._id
    );
    if (productIndex !== -1) {
      updatedStorage.products = [...updatedStorage.products];
      updatedStorage.products[productIndex] = {
        ...updatedStorage.products[productIndex],
        quantity: updatedStorage.products[productIndex].quantity - quantity,
      };
      setStorage(updatedStorage as any);
    }

    const newItem: OrderItem = {
      isProduct: true, // Producto del catálogo
      productId: product._id, // ID del producto
      productName: product.nombre, // Nombre del producto
      quantity,
      unitPrice: product.precio,
      amount: quantity * product.precio,
      productCategory: product.productCategory ?? null,
      insumos: (product.insumos || []).map((insumo: any) => ({
        ...insumo,
        importeVenta: 0, // Los insumos originales no tienen costo adicional
        isExtra: false, // Marcar como no extra
      })),
    };

    const updatedItems = [...formData.items, newItem];
    const totals = recalculateTotals(
      updatedItems,
      formData.discount || 0,
      formData.discountType || "porcentaje",
      formData.deliveryData.deliveryPrice || 0,
      formData.advance || 0
    );

    setFormData({
      ...formData,
      items: updatedItems,
      ...totals,
    });

    toast.success("Producto agregado correctamente");
  };

  // Manejar apertura del scanner QR
  const handleScanQR = () => {
    // Cerrar el modal de detalles de orden temporalmente
    setShowOrderDetailsModal(false);
    // Abrir el scanner
    setShowQRScanner(true);
  };

  // Manejar éxito del escaneo QR
  const handleQRScanSuccess = (scanData: any) => {
    // Guardar los datos del cliente escaneado
    setScannedClientData(scanData);

    // Verificar si el cliente pertenece a la sucursal actual
    if (scanData && scanData.client) {
      // Obtener la sucursal del cliente
      const clientBranchId = scanData.client.branchId || scanData.client.branch;

      // Obtener la sucursal actual (del cajero o la seleccionada por el usuario de redes)
      const currentBranchId = formData.branchId || cashRegister?.branchId?._id;

      // Verificar que el cliente pertenezca a la misma sucursal
      if (clientBranchId && currentBranchId && clientBranchId !== currentBranchId) {
        toast.error("El cliente no corresponde a la sucursal actual");
        // No actualizar el formulario si el cliente no es de la misma sucursal
        setShowQRScanner(false);
        setTimeout(() => {
          setShowOrderDetailsModal(true);
        }, 100);
        return;
      }

      // Si pasa la validación, actualizar el formulario con los datos del cliente
      setFormData((prev) => ({
        ...prev,
        clientInfo: {
          clientId: scanData.client.id,
          name: scanData.client.fullName || `${scanData.client.name} ${scanData.client.lastName}`,
          phone: scanData.client.phoneNumber || "",
          email: scanData.client.email || "",
        },
      }));

      // Cerrar el scanner
      setShowQRScanner(false);

      // Reabrir el modal de detalles con los datos actualizados y el cliente seleccionado
      setTimeout(() => {
        setShowOrderDetailsModal(true);
        // Abrir el dashboard de puntos después de un breve delay
        setTimeout(() => {
          setShowPointsDashboard(true);
        }, 500);
      }, 100);

      toast.success(`Cliente ${scanData.client.fullName} identificado correctamente`);
    }
  };

  // Generar e imprimir ticket de venta
  const generateAndPrintSaleTicket = async (orderData: any) => {
    if (!user) {
      console.error("No hay usuario logueado");
      return;
    }

    try {
      // Obtener datos de la empresa/sucursal
      const companyResponse = await companiesService.getCompanyByBranchId(
        orderData.branchId._id
      );

      if (!companyResponse.success || !companyResponse.data) {
        throw new Error("No se pudieron obtener los datos de la empresa");
      }

      const companyId = companyResponse.data.companyId;
      const branchId = typeof orderData.branchId === "string" 
        ? orderData.branchId 
        : orderData.branchId._id;
      const orderId = orderData._id;

      console.log("IDs para subir tickets:", {
        companyId,
        branchId,
        orderId,
        orderData
      });

      // Buscar el método de pago seleccionado para obtener su nombre
      const selectedPaymentMethod = paymentMethods.find(
        (pm) =>
          pm._id ===
          (typeof orderData.paymentMethod === "string"
            ? orderData.paymentMethod
            : orderData.paymentMethod._id)
      );

      // Construir datos para el ticket
      const ticketData: SaleTicketData = {
        order: {
          orderNumber: orderData.orderNumber,
          createdAt: orderData.createdAt,
          clientInfo: {
            name: orderData.clientInfo.name,
            phone: orderData.clientInfo.phone || "",
          },
          deliveryData: {
            recipientName: orderData.deliveryData.recipientName,
            deliveryDateTime: orderData.deliveryData.deliveryDateTime,
            message: orderData.deliveryData.message || "",
            street: orderData.deliveryData.street,
            reference: orderData.deliveryData.reference,
          },
          items: orderData.items.map((item: any) => ({
            quantity: item.quantity,
            productName: item.productName,
            amount: item.amount,
          })),
          subtotal: orderData.subtotal,
          discount: orderData.discount,
          discountType: orderData.discountType,
          total: orderData.total,
          advance: orderData.advance,
          remainingBalance: orderData.remainingBalance,
          shippingType: orderData.shippingType,
          deliveryPrice: orderData.deliveryData?.deliveryPrice || 0,
          paymentMethod: selectedPaymentMethod?.name || "N/A",
        },
        company: companyResponse.data,
        cashier: {
          fullName: user.profile?.fullName || "Cajero",
        },
        payments: orderData.payments || [],
      };

      // Generar HTML del ticket
      const ticketHTML = generateSaleTicket(ticketData);

      // Variables para guardar las URLs de los tickets
      let saleTicketUrl: string | null = null;
      let saleTicketPath: string | null = null;
      let deliveryTicketUrl: string | null = null;
      let deliveryTicketPath: string | null = null;

      // Subir ticket de venta a Firebase y guardar en base de datos
      try {
        console.log("Iniciando subida de ticket de venta a Firebase...");
        console.log("HTML length:", ticketHTML.length);
        
        if (!companyId || !branchId || !orderId) {
          console.error("Faltan IDs requeridos:", { companyId, branchId, orderId });
          throw new Error("IDs faltantes para subir ticket");
        }
        
        const saleTicketResult = await uploadSaleTicket(
          ticketHTML,
          companyId,
          branchId,
          orderId
        );
        saleTicketUrl = saleTicketResult.url;
        saleTicketPath = saleTicketResult.path;
        console.log("✅ Ticket de venta guardado exitosamente en Firebase:");
        console.log("  URL:", saleTicketUrl);
        console.log("  Path:", saleTicketPath);
        
        // Guardar ticket de venta en la base de datos
        await createTicket({
          orderId,
          branchId,
          url: saleTicketUrl,
          path: saleTicketPath,
          isStoreTicket: true
        });
        console.log("✅ Ticket de venta registrado en base de datos");
      } catch (uploadError: any) {
        console.error("❌ Error al subir ticket de venta:", uploadError);
        console.error("  Mensaje:", uploadError.message);
        console.error("  Stack:", uploadError.stack);
        // No interrumpir el flujo, solo loggear el error
        toast.warning("No se pudo guardar el ticket en la nube, pero se generó correctamente para imprimir");
      }

      // Crear ventana para imprimir
      const printWindow = window.open("", "_blank", "width=800,height=600");

      if (printWindow) {
        printWindow.document.write(ticketHTML);
        printWindow.document.close();

        // Esperar a que se cargue el contenido
        printWindow.onload = () => {
          printWindow.focus();
        };
      } else {
        toast.error(
          "No se pudo abrir la ventana de impresión. Verifica que no esté bloqueada por el navegador."
        );
      }

      // Si es una orden de tipo envío, generar también el ticket de delivery
      if (orderData.shippingType === "envio") {
        try {
          // Preparar datos para el ticket de delivery
          const deliveryTicketData: DeliveryTicketData = {
            order: {
              orderNumber: orderData.orderNumber,
              clientInfo: {
                name: orderData.clientInfo.name,
                phone: orderData.clientInfo.phone || "",
              },
              deliveryData: {
                recipientName: orderData.deliveryData.recipientName,
                deliveryDateTime: orderData.deliveryData.deliveryDateTime,
                street: orderData.deliveryData.street || "",
                neighborhoodName: orderData.deliveryData.neighborhoodId?.name || "",
                reference: orderData.deliveryData.reference || "",
                message: orderData.deliveryData.message || "",
              },
              branchInfo: {
                city: orderData.branchId?.city || companyResponse.data?.address?.city || "",
                state: orderData.branchId?.state || companyResponse.data?.address?.state || "",
              },
            },
          };

          // Generar HTML del ticket de delivery
          const deliveryTicketHTML = generateDeliveryTicket(deliveryTicketData);

          // Subir ticket de envío a Firebase y guardar en base de datos
          try {
            console.log("Iniciando subida de ticket de envío a Firebase...");
            
            const deliveryTicketResult = await uploadDeliveryTicket(
              deliveryTicketHTML,
              companyId,
              branchId,
              orderId
            );
            deliveryTicketUrl = deliveryTicketResult.url;
            deliveryTicketPath = deliveryTicketResult.path;
            console.log("✅ Ticket de envío guardado exitosamente en Firebase:");
            console.log("  URL:", deliveryTicketUrl);
            console.log("  Path:", deliveryTicketPath);
            
            // Guardar ticket de envío en la base de datos
            await createTicket({
              orderId,
              branchId,
              url: deliveryTicketUrl,
              path: deliveryTicketPath,
              isStoreTicket: false
            });
            console.log("✅ Ticket de envío registrado en base de datos");
          } catch (uploadError: any) {
            console.error("❌ Error al subir ticket de envío:", uploadError);
            console.error("  Mensaje:", uploadError.message);
            // No interrumpir el flujo, solo loggear el error
          }

          // Crear ventana para imprimir ticket de delivery
          // Usar setTimeout para evitar que el navegador bloquee múltiples popups
          setTimeout(() => {
            const deliveryPrintWindow = window.open("", "_blank", "width=400,height=600");

            if (deliveryPrintWindow) {
              deliveryPrintWindow.document.write(deliveryTicketHTML);
              deliveryPrintWindow.document.close();

              // Esperar a que se cargue el contenido
              deliveryPrintWindow.onload = () => {
                deliveryPrintWindow.focus();
              };
            } else {
              toast.warning(
                "No se pudo abrir la ventana para el ticket de entrega. Verifica los popups del navegador."
              );
            }
          }, 1000); // Esperar 1 segundo antes de abrir el segundo ticket
        } catch (deliveryError) {
          console.error("Error generando ticket de delivery:", deliveryError);
          // No mostrar error, solo log ya que el ticket principal se generó
        }
      }

      // Después de generar los tickets, verificar si se puede enviar por WhatsApp
      if (orderData.clientInfo.phone && saleTicketUrl) {
        // Preparar datos para el modal
        setWhatsAppTicketData({
          orderNumber: orderData.orderNumber,
          clientName: orderData.clientInfo.name,
          clientPhone: orderData.clientInfo.phone,
          ticketUrl: saleTicketUrl,
          ticketType: 'sale'
        });
        // Mostrar modal
        setShowWhatsAppModal(true);
      }
    } catch (error) {
      console.error("Error generando ticket de venta:", error);
      toast.error("Error al generar el ticket de venta");
    }
  };

  // Enviar formulario con archivos desde el modal
  const handleSubmitWithFiles = async (
    e: React.FormEvent,
    files: { comprobante: File | null; arreglo: File | null }
  ) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Usar los archivos del modal
    const comprobanteFile = files.comprobante;
    const arregloFile = files.arreglo;

    try {
      if (formData.items.length === 0) {
        throw new Error("Debes agregar al menos un producto");
      }
      console.log(formData.items);
      // Validar que haya una caja registradora asignada
      if (!cashRegister) {
        throw new Error(
          "Debes tener una caja registradora asignada para crear órdenes"
        );
      }

      // Validar que la caja esté abierta
      if (!cashRegister.isOpen) {
        throw new Error(
          "La caja registradora debe estar abierta para crear órdenes"
        );
      }

      // Validar si hay productos del catálogo que requieren almacén
      const hasProductsFromCatalog = formData.items.some(
        (item) => item.isProduct === true
      );

      if (hasProductsFromCatalog && !selectedStorageId) {
        throw new Error(
          "Hay productos del catálogo en la orden pero no hay almacén asignado a la sucursal"
        );
      }

      if (!formData.paymentMethod) {
        throw new Error("Debes seleccionar un método de pago");
      }

      // Validar que usuarios de Redes hayan seleccionado una sucursal
      if (isSocialMedia && !formData.branchId) {
        throw new Error(
          "Debes seleccionar una sucursal antes de crear la orden"
        );
      }

      // Validar que usuarios de Redes usen cajas de redes sociales
      if (isSocialMedia && cashRegister && !cashRegister.isSocialMediaBox) {
        throw new Error(
          "Los usuarios de Redes Sociales deben usar cajas de redes sociales"
        );
      }

      const orderData = {
        ...formData,
        storageId: selectedStorageId || null, // Puede ser null si solo hay productos manuales
        // Para usuarios Cajero, forzar salesChannel a 'tienda'
        // Para usuarios Redes, mantener el salesChannel del formData (sincronizado con plataforma)
        salesChannel: isCashier ? "tienda" : formData.salesChannel,
        hasPendingDiscountAuth, // Enviar flag al backend
        discountRequestMessage: discountRequestMessage || null, // Enviar mensaje de solicitud de descuento
      };

      const response = await ordersService.createOrder(orderData);

      // Validar que la respuesta sea exitosa
      if (!response || !response.success) {
        throw new Error(response?.message || "Error al crear la orden");
      }

      // Validar que la respuesta tenga datos
      if (!response.data) {
        throw new Error("No se recibió respuesta del servidor");
      }

      // Subir archivos a Firebase Storage DESPUÉS de crear la orden
      let comprobanteUrl: string | null = null;
      let comprobantePath: string | null = null;
      let arregloUrl: string | null = null;
      let arregloPath: string | null = null;

      if (comprobanteFile || arregloFile) {
        setUploadingFiles(true);
        toast.info("Subiendo archivos a Firebase Storage...");

        try {
          const orderId = response.data._id;
          const branchId =
            typeof response.data.branchId === "string"
              ? response.data.branchId
              : response.data.branchId._id;

          // Obtener companyId a través de la sucursal
          const companyResponse = await companiesService.getCompanyByBranchId(
            branchId
          );

          if (
            !companyResponse.success ||
            !companyResponse.data ||
            !companyResponse.data.companyId
          ) {
            throw new Error("No se pudo obtener la empresa de la sucursal");
          }

          const companyId = companyResponse.data.companyId;

          // Subir comprobante
          if (comprobanteFile) {
            const comprobanteResult = await uploadComprobante(
              comprobanteFile,
              companyId,
              branchId,
              orderId
            );
            comprobanteUrl = comprobanteResult.url;
            comprobantePath = comprobanteResult.path;
          }

          // Subir arreglo
          if (arregloFile) {
            const arregloResult = await uploadArreglo(
              arregloFile,
              companyId,
              branchId,
              orderId
            );
            arregloUrl = arregloResult.url;
            arregloPath = arregloResult.path;
          }

          // Actualizar la orden con las URLs de los archivos
          await ordersService.updateOrder(orderId, {
            comprobanteUrl,
            comprobantePath,
            arregloUrl,
            arregloPath,
          });

          toast.success("Archivos subidos exitosamente");
        } catch (uploadError: any) {
          console.error("Error al subir archivos:", uploadError);
          toast.warning(
            "Orden creada pero hubo un error al subir los archivos. Puedes intentar subirlos después."
          );
        } finally {
          setUploadingFiles(false);
        }
      }

      // Mostrar toast de éxito (el DiscountAuth ya se creó en el backend antes de emitir el socket)
      toast.success(
        `¡Orden ${response.data.orderNumber || ""} creada exitosamente!`
      );

      // Generar e imprimir ticket de venta
      generateAndPrintSaleTicket(response.data);

      setSuccess(true);

      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          // Para Redes usuarios, resetear branchId a vacío para que seleccionen de nuevo
          // Para Cajeros, mantener la sucursal actual
          branchId: isSocialMedia
            ? ""
            : branches.length > 0
            ? branches[0]._id
            : "",
          cashRegisterId: cashRegister ? cashRegister._id : null,
          clientInfo: {
            name: "",
            phone: "",
            email: "",
          },
          salesChannel: isSocialMedia ? "whatsapp" : "tienda",
          items: [],
          shippingType: isSocialMedia ? "redes_sociales" : "tienda",
          anonymous: false,
          quickSale: false,
          deliveryData: {
            recipientName: "",
            deliveryDateTime: "",
            message: "",
            street: "",
            neighborhoodId: "",
            deliveryPrice: 0,
            reference: "",
          },
          paymentMethod: paymentMethods.length > 0 ? paymentMethods[0]._id : "",
          discount: 0,
          discountType: "porcentaje",
          subtotal: 0,
          total: 0,
          advance: 0,
          paidWith: 0,
          change: 0,
          remainingBalance: 0,
          sendToProduction: false,
          isSocialMediaOrder: isSocialMedia,
          socialMedia: isSocialMedia ? "whatsapp" : null,
        });
        setHasPendingDiscountAuth(false);
        setDiscountRequestMessage("");
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.message || "Error al crear el pedido";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="new-order-page"
      style={{ height: "calc(100vh - 100px)", overflow: "hidden" }}
    >
      {hasNoStorage && (
        <Alert
          variant="default"
          className="mb-3 flex items-center gap-2 border-yellow-500 bg-yellow-50"
        >
          <Package size={20} className="text-yellow-600" />
          <AlertDescription>
            <strong>No hay almacén asignado a esta sucursal</strong>
            <p className="mb-0 text-sm">
              Los productos del catálogo se mostrarán con stock en 0. Para poder
              crear órdenes con productos del catálogo, necesitas crear un
              almacén para esta sucursal.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full">
        {/* Catálogo (izquierda) */}
        <div className="lg:col-span-8 h-full flex flex-col">
          {/* Config POS para usuarios Redes (sucursal/caja) */}
          {isSocialMedia && (
            <Card className="shadow-sm mb-3">
              <CardContent className="py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                  <div>
                    <Label className="font-semibold flex items-center gap-2 mb-2">
                      <Store size={16} />
                      Sucursal
                    </Label>
                    <Select
                      value={formData.branchId}
                      onValueChange={(value) => handleBranchChange(value)}
                      disabled={loadingCompanyBranches}
                    >
                      <SelectTrigger className="py-2">
                        <SelectValue
                          placeholder={
                            loadingCompanyBranches
                              ? "Cargando sucursales..."
                              : "-- Selecciona una sucursal --"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {companyBranches.map((branch) => (
                          <SelectItem key={branch._id} value={branch._id}>
                            {branch.branchName} - {branch.branchCode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-semibold flex items-center gap-2 mb-2">
                      <CreditCard size={16} />
                      Caja (Redes)
                    </Label>
                    <div className="flex gap-2">
                      <Select
                        value={selectedCashRegisterId}
                        onValueChange={(value) =>
                          handleCashRegisterSelect(value)
                        }
                        disabled={
                          !formData.branchId || loadingAvailableCashRegisters
                        }
                      >
                        <SelectTrigger className="py-2 flex-1">
                          <SelectValue
                            placeholder={
                              !formData.branchId
                                ? "Selecciona una sucursal primero"
                                : loadingAvailableCashRegisters
                                ? "Cargando cajas..."
                                : "-- Selecciona una caja --"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCashRegisters.map((cr) => (
                            <SelectItem key={cr._id} value={cr._id}>
                              {cr.name} -{" "}
                              {cr.isOpen ? "🟢 Abierta" : "🔴 Cerrada"}
                              {cr.cashierId
                                ? ` (${cr.cashierId.username})`
                                : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedCashRegisterId &&
                        !availableCashRegisters.find(
                          (cr) =>
                            cr._id === selectedCashRegisterId && cr.isOpen
                        ) && (
                          <Button
                            variant="default"
                            onClick={handleOpenCashRegister}
                            disabled={togglingCashRegister}
                            className="whitespace-nowrap bg-green-600 hover:bg-green-700"
                          >
                            {togglingCashRegister ? "Abriendo..." : "Abrir"}
                          </Button>
                        )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm flex-1 flex flex-col">
            <CardHeader className="bg-white py-2 flex-shrink-0">
              <div className="flex items-center w-full justify-between">
                <div className="flex items-center gap-2">
                  <Package size={18} className="text-primary" />
                  <span className="font-bold">Catálogo</span>
                </div>
                <div className="w-[360px] flex-shrink-0">
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      type="text"
                      placeholder="Buscar productos en el catálogo"
                      value={catalogSearchTerm}
                      onChange={(e) => setCatalogSearchTerm(e.target.value)}
                      className="pl-9 h-8"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2 flex-grow-1 overflow-auto">
              <ProductCatalog
                onAddProduct={handleAddProductFromCatalog}
                branchId={formData.branchId}
                itemsInOrder={formData.items}
                storage={storage}
                searchTerm={catalogSearchTerm}
                onSearchChange={setCatalogSearchTerm}
              />
            </CardContent>
          </Card>
        </div>

        {/* Carrito (derecha) */}
        <CartSection
          items={formData.items}
          subtotal={formData.subtotal}
          discount={formData.discount || 0}
          discountType={formData.discountType || "porcentaje"}
          total={formData.total}
          deliveryPrice={formData.deliveryData.deliveryPrice || 0}
          storage={storage}
          onAddItem={handleAddManualItem}
          onRemoveItem={handleRemoveItem}
          onOpenExtrasModal={handleOpenExtrasModal}
          onContinueToCheckout={() => setShowOrderDetailsModal(true)}
        />
      </div>

      {/* Modal POS: datos del pedido */}
      <OrderDetailsModal
        show={showOrderDetailsModal}
        onHide={() => setShowOrderDetailsModal(false)}
        formData={formData}
        setFormData={setFormData}
        cashRegister={cashRegister}
        loadingCashRegister={loadingCashRegister}
        isSocialMedia={isSocialMedia}
        isCashier={isCashier}
        selectedStorageId={selectedStorageId}
        hasPendingDiscountAuth={hasPendingDiscountAuth}
        loading={loading}
        uploadingFiles={uploadingFiles}
        error={error}
        success={success}
        scannedClientId={scannedClientData?.client?.id || null}
        onDiscountChange={handleDiscountChange}
        onSubmit={handleSubmitWithFiles}
        onShowDiscountRequestDialog={() => setShowDiscountRequestDialog(true)}
        onCancelDiscount={() => {
          handleDiscountChange(0, "porcentaje");
          setHasPendingDiscountAuth(false);
          setDiscountRequestMessage("");
        }}
        setError={setError}
        setSuccess={setSuccess}
        onScanQR={handleScanQR}
      />
      {/* Modal de Solicitud de Autorización de Descuento */}
      <DiscountAuthModal
        show={showDiscountRequestDialog}
        onHide={() => setShowDiscountRequestDialog(false)}
        discount={formData.discount || 0}
        discountType={formData.discountType || "porcentaje"}
        onConfirm={(message) => {
          setDiscountRequestMessage(message);
          setHasPendingDiscountAuth(true);
        }}
      />

      {/* Modal para agregar extras (materiales) */}
      <AddExtrasModal
        show={showAddExtrasModal}
        onHide={() => {
          setShowAddExtrasModal(false);
          setSelectedItemIndexForExtras(-1);
        }}
        storage={storage}
        onAddExtras={handleAddExtras}
      />

      {/* Modal de QR Scanner */}
      <QRScanner
        show={showQRScanner}
        onHide={() => setShowQRScanner(false)}
        onScanSuccess={handleQRScanSuccess}
        branchId={formData.branchId}
      />

      {/* Modal del Dashboard de Puntos */}
      {scannedClientData && (
        <ClientPointsDashboardModal
          show={showPointsDashboard}
          onHide={() => {
            setShowPointsDashboard(false);
            // No limpiar scannedClientData para mantener los datos del cliente en el formulario
          }}
          client={{
            _id: scannedClientData.client.id,
            name: scannedClientData.client.name,
            lastName: scannedClientData.client.lastName,
            clientNumber: scannedClientData.client.clientNumber,
            phoneNumber: scannedClientData.client.phoneNumber,
            email: scannedClientData.client.email,
            points: scannedClientData.client.points,
            status: scannedClientData.client.status,
          }}
          branchId={formData.branchId}
        />
      )}

      {/* Modal de WhatsApp para enviar ticket */}
      {whatsAppTicketData && (
        <WhatsAppTicketModal
          isOpen={showWhatsAppModal}
          onClose={() => {
            setShowWhatsAppModal(false);
            setWhatsAppTicketData(null);
          }}
          orderNumber={whatsAppTicketData.orderNumber}
          clientName={whatsAppTicketData.clientName}
          clientPhone={whatsAppTicketData.clientPhone}
          ticketUrl={whatsAppTicketData.ticketUrl}
          ticketType={whatsAppTicketData.ticketType}
          onSuccess={() => {
            // Opcional: acciones adicionales después de enviar exitosamente
            console.log('Ticket enviado por WhatsApp exitosamente');
          }}
        />
      )}
    </div>
  );
};

export default NewOrderPage;
