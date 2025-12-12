"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Button,
  Row,
  Col,
  Badge,
  Alert,
  Modal,
} from "react-bootstrap";
import {
  User,
  Phone,
  Mail,
  Store,
  Package,
  Calendar,
  MessageSquare,
  Upload,
  CreditCard,
  Send,
  Plus,
  Trash2,
  Search,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ordersService } from "./services/orders";
import { CreateOrderData, OrderItem, ShippingType } from "./types";
import ProductCatalog from "./components/ProductCatalog";
import AddExtrasModal from "./components/AddExtrasModal";
import { clientsService } from "@/features/admin/modules/clients/services/clients";
import { Client } from "@/features/admin/modules/clients/types";
import { paymentMethodsService } from "@/features/admin/modules/payment-methods/services/paymentMethods";
import { PaymentMethod } from "@/features/admin/modules/payment-methods/types";
import { branchesService } from "@/features/admin/modules/branches/services/branches";
import { Branch } from "@/features/admin/modules/branches/types";
import { cashRegistersService } from "@/features/admin/modules/cash-registers/services/cashRegisters";
import { CashRegister } from "@/features/admin/modules/cash-registers/types";
import { storageService } from "@/features/admin/modules/storage/services/storage";
import { Storage } from "@/features/admin/modules/storage/types";
import { neighborhoodsService } from "@/features/admin/modules/neighborhoods/services/neighborhoods";
import { Neighborhood } from "@/features/admin/modules/neighborhoods/types";
import { toast } from "react-toastify";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { companiesService } from "@/features/admin/modules/companies/services/companies";
import { generateSaleTicket, SaleTicketData } from "./utils/generateSaleTicket";
import { discountAuthService } from "@/features/admin/modules/discount-auth/services/discountAuth";
import { Shield } from "lucide-react";
import { uploadComprobante, uploadArreglo } from "@/services/firebaseStorage";
import { productCategoriesService } from "@/features/admin/modules/productCategories/services/productCategories";
import { ProductCategory } from "@/features/admin/modules/productCategories/types";
import {
  setCustomValidationMessage,
  resetCustomValidationMessage,
} from "@/utils/formValidation";

const NewOrderPage = () => {
  const router = useRouter();
  const { getIsCashier, getIsSocialMedia } = useUserRoleStore();
  const { user } = useUserSessionStore();
  const isCashier = getIsCashier();
  const isSocialMedia = getIsSocialMedia();

  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
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
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
  const [showClientInfo, setShowClientInfo] = useState(false);
  const [showDiscountRequestDialog, setShowDiscountRequestDialog] =
    useState(false);
  const [discountRequestMessage, setDiscountRequestMessage] = useState("");
  const [requestingDiscount, setRequestingDiscount] = useState(false);
  const [hasPendingDiscountAuth, setHasPendingDiscountAuth] = useState(false);
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  const [arregloFile, setArregloFile] = useState<File | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>(
    []
  );
  const [loadingProductCategories, setLoadingProductCategories] =
    useState(false);
  const [selectedProductCategory, setSelectedProductCategory] =
    useState<string>("");
  const [showAddExtrasModal, setShowAddExtrasModal] = useState(false);
  const [selectedItemIndexForExtras, setSelectedItemIndexForExtras] =
    useState<number>(-1);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [catalogSearchTerm, setCatalogSearchTerm] = useState("");

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

  const [currentItem, setCurrentItem] = useState<OrderItem>({
    isProduct: false,
    productName: "",
    quantity: 1,
    unitPrice: 0,
    amount: 0,
    productCategory: null,
  });

  const [currentProductName, setCurrentProductName] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Obtener todos los clientes filtrados por sucursal
  const fetchClients = async (branchId?: string) => {
    setLoadingClients(true);
    try {
      const filters: any = {
        limit: 1000,
        status: true,
      };

      // Si se proporciona branchId, agregarlo al filtro
      if (branchId) {
        filters.branchId = branchId;
      }

      const response = await clientsService.getAllClients(filters);
      setClients(response.data);
    } catch (err) {
      console.error("Error al cargar clientes:", err);
    } finally {
      setLoadingClients(false);
    }
  };

  // Obtener todos los métodos de pago
  const fetchPaymentMethods = async () => {
    setLoadingPaymentMethods(true);
    try {
      const response = await paymentMethodsService.getAllPaymentMethods({
        limit: 1000,
        status: true,
      });
      console.log("Respuesta completa métodos de pago:", response);
      console.log("Data de métodos de pago:", response.data);
      console.log("Cantidad de métodos:", response.data?.length);
      setPaymentMethods(response.data);
      // Establecer el primer método de pago como predeterminado
      if (response.data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          paymentMethod: response.data[0]._id,
        }));
      }
    } catch (err) {
      console.error("Error al cargar métodos de pago:", err);
      toast.error("Error al cargar los métodos de pago");
    } finally {
      setLoadingPaymentMethods(false);
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

  // Obtener colonias activas
  const fetchActiveNeighborhoods = async () => {
    setLoadingNeighborhoods(true);
    try {
      const response = await neighborhoodsService.getAllNeighborhoods({
        limit: 1000,
        status: "active",
      });
      setNeighborhoods(response.data);
    } catch (err) {
      console.error("Error al cargar colonias:", err);
      toast.error("Error al cargar las colonias");
    } finally {
      setLoadingNeighborhoods(false);
    }
  };

  // Obtener categorías de productos activas
  const fetchProductCategories = async () => {
    setLoadingProductCategories(true);
    try {
      const response = await productCategoriesService.getAllProductCategories({
        limit: 1000,
        isActive: true,
      });
      console.log("Respuesta completa categorías de productos:", response);
      console.log("Data de categorías:", response.data);
      console.log("Cantidad de categorías:", response.data?.length);
      setProductCategories(response.data);
    } catch (err) {
      console.error("Error al cargar categorías de productos:", err);
      toast.error("Error al cargar las categorías de productos");
    } finally {
      setLoadingProductCategories(false);
    }
  };

  // Cargar métodos de pago, sucursales, caja registradora, colonias y categorías al montar el componente
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
    fetchActiveNeighborhoods();
    fetchProductCategories();
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

  // Cargar clientes filtrados por sucursal cuando cambia la sucursal
  useEffect(() => {
    if (formData.branchId) {
      fetchClients(formData.branchId);
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

  // Manejar selección de cliente
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);

    if (!clientId) {
      // Limpiar campos si se deselecciona
      setFormData({
        ...formData,
        clientInfo: {
          name: "",
          phone: "",
          email: "",
        },
      });
      return;
    }

    const selectedClient = clients.find((c) => c._id === clientId);
    if (selectedClient) {
      setFormData({
        ...formData,
        clientInfo: {
          clientId: selectedClient._id,
          name: `${selectedClient.name} ${selectedClient.lastName}`,
          phone: selectedClient.phoneNumber,
          email: selectedClient.email || "",
        },
      });
    }
  };

  // Calcular importe del item actual
  const calculateItemAmount = () => {
    return currentItem.quantity * currentItem.unitPrice;
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

  // Agregar item a la lista
  const handleAddItem = () => {
    if (!currentProductName || currentItem.unitPrice <= 0) {
      setError("Por favor completa el nombre del producto y el precio");
      return;
    }

    if (!selectedProductCategory) {
      setError("Por favor selecciona una categoría para el producto");
      toast.error("Debes seleccionar una categoría para el producto");
      return;
    }

    const newItem: OrderItem = {
      ...currentItem,
      isProduct: false, // Producto manual
      productName: currentProductName,
      amount: calculateItemAmount(),
      productCategory: selectedProductCategory,
    };
    console.log("producto manual:", newItem);
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

    // Reset current item
    setCurrentItem({
      isProduct: false,
      productName: "",
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      productCategory: null,
    });
    setCurrentProductName("");
    setSelectedProductCategory("");
    setError(null);
  };

  // Eliminar item
  const handleRemoveItem = async (index: number) => {
    const itemToRemove = formData.items[index];

    // Solo liberar stock si es un producto del catálogo (isProduct: true)
    if (itemToRemove.isProduct && itemToRemove.productId && storage) {
      try {
        // Liberar el stock en el almacén
        const response = await storageService.releaseStock(storage._id, {
          productId: itemToRemove.productId,
          quantity: itemToRemove.quantity,
        });

        // Actualizar el storage local con los datos actualizados
        setStorage(response.data);
      } catch (err: any) {
        console.error("Error al liberar stock:", err);
        toast.error(err.message || "Error al liberar el stock");
        return; // No continuar con la eliminación si falla la liberación
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

    if (itemToRemove.isProduct) {
      toast.success("Producto eliminado y stock restaurado");
    }
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

    try {
      // Reducir el stock de los materiales en el almacén
      for (const extra of extras) {
        await storageService.removeMaterialsFromStorage(storage._id, {
          materials: [
            { materialId: extra.materialId, quantity: extra.quantity },
          ],
        });
      }

      // Actualizar el storage local
      const updatedStorage = await storageService.getStorageById(storage._id);
      setStorage(updatedStorage.data);

      // Agregar los materiales como insumos al item seleccionado
      const updatedItems = [...formData.items];
      const currentItem = updatedItems[selectedItemIndexForExtras];

      const newInsumos = extras.map((extra) => ({
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
    } catch (error: any) {
      console.error("Error al agregar extras:", error);
      toast.error(error.message || "Error al agregar extras");
    }
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

  // Manejar cambio de tipo de envío
  const handleShippingTypeChange = (shippingType: ShippingType) => {
    const deliveryPrice =
      shippingType === "tienda" ? 0 : formData.deliveryData.deliveryPrice || 0;
    const totals = recalculateTotals(
      formData.items,
      formData.discount || 0,
      formData.discountType || "porcentaje",
      deliveryPrice,
      formData.advance || 0
    );

    setFormData({
      ...formData,
      shippingType,
      deliveryData: {
        ...formData.deliveryData,
        deliveryPrice:
          shippingType === "tienda"
            ? 0
            : formData.deliveryData.deliveryPrice || 0,
        neighborhoodId:
          shippingType === "tienda" ? "" : formData.deliveryData.neighborhoodId,
      },
      ...totals,
    });
  };

  // Manejar cambio de colonia
  const handleNeighborhoodChange = (neighborhoodId: string) => {
    const selectedNeighborhood = neighborhoods.find(
      (n) => n._id === neighborhoodId
    );
    const deliveryPrice = selectedNeighborhood
      ? selectedNeighborhood.priceDelivery
      : 0;

    const totals = recalculateTotals(
      formData.items,
      formData.discount || 0,
      formData.discountType || "porcentaje",
      deliveryPrice,
      formData.advance || 0
    );

    setFormData({
      ...formData,
      deliveryData: {
        ...formData.deliveryData,
        neighborhoodId,
        deliveryPrice,
      },
      ...totals,
    });
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

    try {
      // Reservar el stock en el almacén
      const response = await storageService.reserveStock(storage._id, {
        productId: product._id,
        quantity,
      });

      // Actualizar el storage local con los datos actualizados
      setStorage(response.data);

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
    } catch (err: any) {
      console.error("Error al reservar stock:", err);
      toast.error(err.message || "Error al agregar el producto");
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
    } catch (error) {
      console.error("Error generando ticket de venta:", error);
      toast.error("Error al generar el ticket de venta");
    }
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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

      // Si hay descuento pendiente, crear la solicitud de autorización
      if (hasPendingDiscountAuth && discountRequestMessage.trim()) {
        try {
          const discountAmount =
            formData.discountType === "porcentaje"
              ? (formData.subtotal * (formData.discount || 0)) / 100
              : formData.discount || 0;

          await discountAuthService.createDiscountAuthForOrder({
            message: discountRequestMessage,
            branchId: formData.branchId,
            orderId: response.data._id,
            orderTotal: response.data.total,
            discountValue: formData.discount || 0,
            discountType: formData.discountType || "porcentaje",
            discountAmount: discountAmount,
          });

          toast.success("Solicitud de descuento creada y enviada al gerente");
        } catch (discountErr: any) {
          console.error("Error al crear solicitud de descuento:", discountErr);
          toast.warning(
            "Orden creada pero hubo un error al crear la solicitud de descuento"
          );
        }
      }

      // Mostrar toast de éxito
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
        setSelectedClientId("");
        setHasPendingDiscountAuth(false);
        setDiscountRequestMessage("");
        setComprobanteFile(null);
        setArregloFile(null);
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
          variant="warning"
          className="mb-3 d-flex align-items-center gap-2"
        >
          <Package size={20} />
          <div>
            <strong>No hay almacén asignado a esta sucursal</strong>
            <p className="mb-0 small">
              Los productos del catálogo se mostrarán con stock en 0. Para poder
              crear órdenes con productos del catálogo, necesitas crear un
              almacén para esta sucursal.
            </p>
          </div>
        </Alert>
      )}

      <Row className="g-3" style={{ height: "100%" }}>
        {/* Catálogo (izquierda) */}
        <Col xs={12} lg={8} style={{ height: "100%" }}>
          {/* Config POS para usuarios Redes (sucursal/caja) */}
          {isSocialMedia && (
            <Card className="border-0 shadow-sm mb-3">
              <Card.Body>
                <Row className="g-3 align-items-end">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        <Store size={16} className="me-2" />
                        Sucursal
                      </Form.Label>
                      <Form.Select
                        value={formData.branchId}
                        onChange={(e) => handleBranchChange(e.target.value)}
                        className="py-2"
                        disabled={loadingCompanyBranches}
                      >
                        <option value="">
                          {loadingCompanyBranches
                            ? "Cargando sucursales..."
                            : "-- Selecciona una sucursal --"}
                        </option>
                        {companyBranches.map((branch) => (
                          <option key={branch._id} value={branch._id}>
                            {branch.branchName} - {branch.branchCode}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        <CreditCard size={16} className="me-2" />
                        Caja (Redes)
                      </Form.Label>
                      <div className="d-flex gap-2">
                        <Form.Select
                          value={selectedCashRegisterId}
                          onChange={(e) =>
                            handleCashRegisterSelect(e.target.value)
                          }
                          className="py-2"
                          disabled={
                            !formData.branchId || loadingAvailableCashRegisters
                          }
                        >
                          <option value="">
                            {!formData.branchId
                              ? "Selecciona una sucursal primero"
                              : loadingAvailableCashRegisters
                              ? "Cargando cajas..."
                              : "-- Selecciona una caja --"}
                          </option>
                          {availableCashRegisters.map((cr) => (
                            <option key={cr._id} value={cr._id}>
                              {cr.name} -{" "}
                              {cr.isOpen ? "🟢 Abierta" : "🔴 Cerrada"}
                              {cr.cashierId
                                ? ` (${cr.cashierId.username})`
                                : ""}
                            </option>
                          ))}
                        </Form.Select>
                        {selectedCashRegisterId &&
                          !availableCashRegisters.find(
                            (cr) =>
                              cr._id === selectedCashRegisterId && cr.isOpen
                          ) && (
                            <Button
                              variant="success"
                              onClick={handleOpenCashRegister}
                              disabled={togglingCashRegister}
                              style={{ whiteSpace: "nowrap" }}
                            >
                              {togglingCashRegister ? "Abriendo..." : "Abrir"}
                            </Button>
                          )}
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          <Card className="border-0 shadow-sm h-100 d-flex flex-column">
            <Card.Header className="bg-white border-0 py-2 flex-shrink-0">
              <div
                className="d-flex align-items-center w-100"
                style={{ justifyContent: "space-between" }}
              >
                <div className="d-flex align-items-center gap-2">
                  <Package size={18} className="text-primary" />
                  <span className="fw-bold">Catálogo</span>
                </div>
                <div style={{ width: "360px", flexShrink: 0 }}>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white border-end-0">
                      <Search size={14} className="text-muted" />
                    </span>
                    <Form.Control
                      type="text"
                      placeholder="Buscar productos en el catálogo"
                      value={catalogSearchTerm}
                      onChange={(e) => setCatalogSearchTerm(e.target.value)}
                      className="border-start-0 ps-0"
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            </Card.Header>
            <Card.Body className="p-2 flex-grow-1" style={{ overflow: "auto" }}>
              <ProductCatalog
                onAddProduct={handleAddProductFromCatalog}
                branchId={formData.branchId}
                itemsInOrder={formData.items}
                storage={storage}
                searchTerm={catalogSearchTerm}
                onSearchChange={setCatalogSearchTerm}
              />
            </Card.Body>
          </Card>
        </Col>

        {/* Carrito (derecha) */}
        <Col xs={12} lg={4} style={{ height: "100%" }}>
          <Card className="border-0 shadow-sm h-100 d-flex flex-column">
            <Card.Header className="bg-white border-0 py-2 flex-shrink-0">
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold">Carrito</span>
                <Badge bg="primary">{formData.items.length}</Badge>
              </div>
            </Card.Header>
            <Card.Body className="flex-grow-1" style={{ overflow: "auto" }}>
              {/* Producto manual rápido */}
              <div className="mb-3">
                <div className="fw-semibold mb-2">Producto manual</div>
                <Row className="g-2">
                  <Col xs={12}>
                    <Form.Control
                      type="text"
                      placeholder="Nombre del producto"
                      value={currentProductName}
                      onChange={(e) => setCurrentProductName(e.target.value)}
                      className="py-2"
                    />
                  </Col>
                  <Col xs={6}>
                    <Form.Control
                      type="number"
                      min="1"
                      value={currentItem.quantity}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          quantity: parseInt(e.target.value) || 1,
                        })
                      }
                      className="py-2 text-center"
                    />
                  </Col>
                  <Col xs={6}>
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Precio"
                      value={currentItem.unitPrice || ""}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          unitPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="py-2"
                    />
                  </Col>
                  <Col xs={12}>
                    <Form.Select
                      value={selectedProductCategory}
                      onChange={(e) =>
                        setSelectedProductCategory(e.target.value)
                      }
                      className="py-2"
                      disabled={loadingProductCategories}
                    >
                      <option value="">
                        {loadingProductCategories
                          ? "Cargando categorías..."
                          : "-- Categoría --"}
                      </option>
                      {productCategories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col xs={12} className="d-grid">
                    <Button variant="outline-primary" onClick={handleAddItem}>
                      <Plus size={16} className="me-2" />
                      Agregar (${calculateItemAmount().toFixed(2)})
                    </Button>
                  </Col>
                </Row>
              </div>

              {/* Lista de items */}
              {formData.items.length === 0 ? (
                <Alert variant="light" className="mb-0">
                  Aún no hay productos. Agrega desde el catálogo.
                </Alert>
              ) : (
                <div
                  className="table-responsive"
                  style={{ maxHeight: 340, overflow: "auto" }}
                >
                  <table className="table table-sm align-middle">
                    <tbody>
                      {formData.items.map((item, index) => (
                        <React.Fragment key={index}>
                          <tr>
                            <td>
                              <div className="fw-semibold">
                                {item.productName}
                              </div>
                              <div className="text-muted small">
                                {item.quantity} × ${item.unitPrice.toFixed(2)}{" "}
                                <Badge
                                  bg={item.isProduct ? "success" : "secondary"}
                                  className="ms-2"
                                >
                                  {item.isProduct ? "Catálogo" : "Manual"}
                                </Badge>
                              </div>
                            </td>
                            <td className="text-end fw-bold">
                              ${item.amount.toFixed(2)}
                            </td>
                            <td className="text-end" style={{ width: 96 }}>
                              <div className="d-flex justify-content-end gap-1">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleOpenExtrasModal(index)}
                                  title="Agregar extras"
                                  disabled={
                                    !storage ||
                                    !storage.materials ||
                                    storage.materials.length === 0
                                  }
                                >
                                  <Plus size={16} />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleRemoveItem(index)}
                                  title="Eliminar"
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                          {item.insumos &&
                            item.insumos.length > 0 &&
                            item.insumos.map((insumo, idx) => (
                              <tr
                                key={`${index}-insumo-${idx}`}
                                className="border-0"
                              >
                                <td className="py-1 ps-4 border-0 text-muted small">
                                  {insumo.cantidad} {insumo.nombre}
                                  {insumo.isExtra && (
                                    <Badge
                                      bg="info"
                                      className="ms-2 text-white"
                                      style={{ fontSize: "0.65rem" }}
                                    >
                                      Extra
                                    </Badge>
                                  )}
                                </td>
                                <td className="py-1 border-0 text-end text-muted small">
                                  {insumo.isExtra
                                    ? `+$${insumo.importeVenta.toFixed(2)}`
                                    : ""}
                                </td>
                                <td className="py-1 border-0"></td>
                              </tr>
                            ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <hr />

              {/* Totales */}
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Subtotal</span>
                <span className="fw-semibold">
                  ${formData.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Descuento</span>
                <span className="text-danger fw-semibold">
                  -$
                  {(formData.discountType === "porcentaje"
                    ? (formData.subtotal * (formData.discount || 0)) / 100
                    : formData.discount || 0
                  ).toFixed(2)}
                </span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Envío</span>
                <span className="text-success fw-semibold">
                  +${(formData.deliveryData.deliveryPrice || 0).toFixed(2)}
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center border-top pt-2">
                <span className="fs-5 fw-bold">Total</span>
                <span className="fs-4 fw-bold text-primary">
                  ${formData.total.toFixed(2)}
                </span>
              </div>
            </Card.Body>
            <Card.Footer className="bg-white border-0 p-3 flex-shrink-0">
              <div className="d-grid gap-2">
                <Button
                  variant="primary"
                  size="lg"
                  disabled={formData.items.length === 0}
                  onClick={() => {
                    if (formData.items.length === 0) {
                      toast.error("Agrega al menos un producto para continuar");
                      return;
                    }
                    setShowClientInfo(true);
                    setShowOrderDetailsModal(true);
                  }}
                >
                  Datos del pedido / Cobrar
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => window.history.back()}
                >
                  Salir
                </Button>
              </div>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {/* Modal POS: datos del pedido */}
      <Modal
        show={showOrderDetailsModal}
        onHide={() => setShowOrderDetailsModal(false)}
        size="xl"
        centered
        backdrop="static"
      >
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="d-flex align-items-center gap-2">
              <CreditCard size={20} />
              Datos del pedido
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && (
              <Alert
                variant="danger"
                onClose={() => setError(null)}
                dismissible
                className="mb-3"
              >
                {error}
              </Alert>
            )}
            {success && (
              <Alert
                variant="success"
                onClose={() => setSuccess(false)}
                dismissible
                className="mb-3"
              >
                ¡Pedido creado exitosamente!
              </Alert>
            )}

            <Row className="g-3">
              {/* Cliente */}
              <Col lg={6}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Header className="bg-white border-0 py-3">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <User size={18} className="text-primary" />
                        <h6 className="mb-0 fw-bold">Cliente</h6>
                      </div>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => setShowClientInfo(!showClientInfo)}
                        className="d-flex align-items-center gap-2"
                      >
                        {showClientInfo ? (
                          <>
                            <EyeOff size={16} />
                            Ocultar
                          </>
                        ) : (
                          <>
                            <Eye size={16} />
                            Ver
                          </>
                        )}
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <Row className="g-3">
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">
                            <Search size={16} className="me-2" />
                            Buscar cliente existente
                          </Form.Label>
                          <Form.Select
                            value={selectedClientId}
                            onChange={(e) => handleClientSelect(e.target.value)}
                            className="py-2"
                            disabled={loadingClients}
                          >
                            <option value="">
                              Seleccionar cliente o ingresar nuevo...
                            </option>
                            {clients.map((client) => (
                              <option key={client._id} value={client._id}>
                                {client.name} {client.lastName} -{" "}
                                {client.phoneNumber}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      {!isSocialMedia && (
                        <Col md={12}>
                          <Form.Group>
                            <Form.Label className="fw-semibold">
                              <CreditCard size={16} className="me-2" />
                              Caja registradora
                            </Form.Label>
                            <div className="d-flex gap-2">
                              <Form.Control
                                type="text"
                                value={
                                  loadingCashRegister
                                    ? "Cargando..."
                                    : cashRegister
                                    ? cashRegister.name
                                    : "No hay caja asignada"
                                }
                                readOnly
                                disabled
                                className="py-2 bg-light"
                              />
                              {cashRegister ? (
                                <Badge
                                  bg={
                                    cashRegister.isOpen
                                      ? "success"
                                      : "secondary"
                                  }
                                  className="d-flex align-items-center justify-content-center py-2 px-3"
                                  style={{
                                    minWidth: "120px",
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  {cashRegister.isOpen
                                    ? "🟢 Abierta"
                                    : "🔴 Cerrada"}
                                </Badge>
                              ) : (
                                !loadingCashRegister && (
                                  <Button
                                    variant="primary"
                                    onClick={() => router.push("/ventas/cajas")}
                                    className="d-flex align-items-center gap-2"
                                    style={{ minWidth: "160px" }}
                                  >
                                    <ExternalLink size={16} />
                                    Ir a Cajas
                                  </Button>
                                )
                              )}
                            </div>
                          </Form.Group>
                        </Col>
                      )}

                      {showClientInfo && (
                        <>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="fw-semibold">
                                <User size={16} className="me-2" />
                                Cliente
                              </Form.Label>
                              <Form.Control
                                type="text"
                                placeholder="Nombre del cliente"
                                value={formData.clientInfo.name}
                                onChange={(e) => {
                                  resetCustomValidationMessage(e);
                                  setFormData({
                                    ...formData,
                                    clientInfo: {
                                      ...formData.clientInfo,
                                      name: e.target.value,
                                    },
                                  });
                                  setSelectedClientId("");
                                }}
                                onInvalid={setCustomValidationMessage}
                                required
                                className="py-2"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={3}>
                            <Form.Group>
                              <Form.Label className="fw-semibold">
                                <Phone size={16} className="me-2" />
                                Teléfono
                              </Form.Label>
                              <Form.Control
                                type="tel"
                                placeholder="Teléfono"
                                value={formData.clientInfo.phone}
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    clientInfo: {
                                      ...formData.clientInfo,
                                      phone: e.target.value,
                                    },
                                  });
                                  setSelectedClientId("");
                                }}
                                className="py-2"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={3}>
                            <Form.Group>
                              <Form.Label className="fw-semibold">
                                <Mail size={16} className="me-2" />
                                Correo
                              </Form.Label>
                              <Form.Control
                                type="email"
                                placeholder="Correo electrónico"
                                value={formData.clientInfo.email}
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    clientInfo: {
                                      ...formData.clientInfo,
                                      email: e.target.value,
                                    },
                                  });
                                  setSelectedClientId("");
                                }}
                                className="py-2"
                              />
                            </Form.Group>
                          </Col>

                          {!isSocialMedia && !isCashier && (
                            <Col md={12}>
                              <Form.Group>
                                <Form.Label className="fw-semibold">
                                  <Store size={16} className="me-2" />
                                  Canal de venta
                                </Form.Label>
                                <Form.Select
                                  value={formData.salesChannel}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      salesChannel: e.target.value as
                                        | "tienda"
                                        | "whatsapp"
                                        | "facebook"
                                        | "instagram",
                                    })
                                  }
                                  required
                                  className="py-2"
                                >
                                  <option value="tienda">Tienda</option>
                                  <option value="whatsapp">WhatsApp</option>
                                  <option value="facebook">Facebook</option>
                                  <option value="instagram">Instagram</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                          )}
                        </>
                      )}
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Tipo de Envío */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  <Send size={20} className="text-primary" />
                  <h5 className="mb-0 fw-bold">Tipo de Envío</h5>
                </div>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  {/* Para usuarios de Redes, mostrar solo "Redes Sociales" y el select de plataforma */}
                  {isSocialMedia ? (
                    <>
                      <Col md={12}>
                        <Alert variant="info" className="mb-3">
                          Como usuario de Redes Sociales, solo puedes crear
                          órdenes de tipo "Redes Sociales"
                        </Alert>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">
                            <Store size={16} className="me-2" />
                            Tipo de Envío
                          </Form.Label>
                          <Form.Control
                            type="text"
                            value="Redes Sociales"
                            disabled
                            className="py-2 bg-light"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">
                            <Store size={16} className="me-2" />
                            Plataforma de Redes Sociales
                          </Form.Label>
                          <Form.Select
                            value={formData.socialMedia || "whatsapp"}
                            onChange={(e) => {
                              const platform = e.target.value as
                                | "whatsapp"
                                | "facebook"
                                | "instagram";
                              setFormData({
                                ...formData,
                                socialMedia: platform,
                                salesChannel: platform, // Sincronizar salesChannel con socialMedia
                              });
                            }}
                            required
                            className="py-2"
                          >
                            <option value="whatsapp">WhatsApp</option>
                            <option value="facebook">Facebook</option>
                            <option value="instagram">Instagram</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </>
                  ) : (
                    /* Para usuarios normales, mostrar opciones de envío tradicionales */
                    <Col md={12}>
                      <div className="d-flex gap-4 flex-wrap align-items-center">
                        {["envio", "tienda"].map((tipo) => (
                          <Form.Check
                            key={tipo}
                            type="radio"
                            id={`envio-${tipo}`}
                            name="envio"
                            label={tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                            value={tipo}
                            checked={formData.shippingType === tipo}
                            onChange={(e) =>
                              handleShippingTypeChange(
                                e.target.value as ShippingType
                              )
                            }
                            className="custom-radio"
                          />
                        ))}

                        <div className="border-start ps-3 d-flex gap-3">
                          <Form.Check
                            type="checkbox"
                            id="anonimo-check"
                            label="Anónimo"
                            checked={formData.anonymous}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                anonymous: e.target.checked,
                              })
                            }
                          />
                          <Form.Check
                            type="checkbox"
                            id="venta-rapida-check"
                            label="Venta Rápida"
                            checked={formData.quickSale}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                quickSale: e.target.checked,
                              })
                            }
                          />
                        </div>
                      </div>
                    </Col>
                  )}

                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">
                            Nombre de quien recibe
                          </Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Nombre del receptor"
                            value={formData.deliveryData.recipientName}
                            onChange={(e) => {
                              resetCustomValidationMessage(e);
                              setFormData({
                                ...formData,
                                deliveryData: {
                                  ...formData.deliveryData,
                                  recipientName: e.target.value,
                                },
                              });
                            }}
                            onInvalid={setCustomValidationMessage}
                            required
                            className="py-2"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">
                            Fecha y hora de entrega
                          </Form.Label>
                          <Form.Control
                            type="datetime-local"
                            value={formData.deliveryData.deliveryDateTime}
                            onChange={(e) => {
                              resetCustomValidationMessage(e);
                              setFormData({
                                ...formData,
                                deliveryData: {
                                  ...formData.deliveryData,
                                  deliveryDateTime: e.target.value,
                                },
                              });
                            }}
                            onInvalid={setCustomValidationMessage}
                            min={new Date().toISOString().slice(0, 16)}
                            required
                            className="py-2"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">
                            Mensaje / Comentario
                          </Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder="Mensaje para la tarjeta o comentario"
                            value={formData.deliveryData.message}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                deliveryData: {
                                  ...formData.deliveryData,
                                  message: e.target.value,
                                },
                              })
                            }
                          />
                        </Form.Group>
                      </Col>

                      {formData.shippingType === "envio" && (
                        <>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="fw-semibold">
                                Calle y número
                              </Form.Label>
                              <Form.Control
                                type="text"
                                placeholder="Ej: Av. Principal #123"
                                value={formData.deliveryData.street}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    deliveryData: {
                                      ...formData.deliveryData,
                                      street: e.target.value,
                                    },
                                  })
                                }
                                className="py-2"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="fw-semibold">
                                Colonia
                              </Form.Label>
                              <Form.Select
                                value={formData.deliveryData.neighborhoodId}
                                onChange={(e) =>
                                  handleNeighborhoodChange(e.target.value)
                                }
                                className="py-2"
                                disabled={loadingNeighborhoods}
                              >
                                <option value="">Seleccionar colonia...</option>
                                {neighborhoods.map((neighborhood) => (
                                  <option
                                    key={neighborhood._id}
                                    value={neighborhood._id}
                                  >
                                    {neighborhood.name} - $
                                    {neighborhood.priceDelivery.toFixed(2)}
                                  </option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          <Col md={12}>
                            <Form.Group>
                              <Form.Label className="fw-semibold">
                                Señas o referencias
                              </Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={2}
                                placeholder="Ej: Casa blanca con portón negro..."
                                value={formData.deliveryData.reference}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    deliveryData: {
                                      ...formData.deliveryData,
                                      reference: e.target.value,
                                    },
                                  })
                                }
                              />
                            </Form.Group>
                          </Col>
                        </>
                      )}

                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">
                            <Upload size={16} className="me-2" />
                            Comprobante
                          </Form.Label>
                          <Form.Control
                            type="file"
                            className="py-2"
                            accept="image/*,.pdf"
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => {
                              const file = e.target.files?.[0];
                              if (file) setComprobanteFile(file);
                            }}
                          />
                          {comprobanteFile && (
                            <Form.Text className="text-success">
                              ✓ {comprobanteFile.name}
                            </Form.Text>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">
                            <Upload size={16} className="me-2" />
                            Arreglo
                          </Form.Label>
                          <Form.Control
                            type="file"
                            className="py-2"
                            accept="image/*"
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => {
                              const file = e.target.files?.[0];
                              if (file) setArregloFile(file);
                            }}
                          />
                          {arregloFile && (
                            <Form.Text className="text-success">
                              ✓ {arregloFile.name}
                            </Form.Text>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

            {/* Forma de Pago y Resumen */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  <CreditCard size={20} className="text-primary" />
                  <h5 className="mb-0 fw-bold">Forma de Pago</h5>
                </div>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={12}>
                    <Form.Label className="fw-semibold">
                      Método de Pago
                    </Form.Label>
                    <div className="d-flex gap-2 flex-wrap">
                      {loadingPaymentMethods ? (
                        <div className="text-muted">
                          Cargando métodos de pago...
                        </div>
                      ) : paymentMethods.length === 0 ? (
                        <Alert variant="danger" className="mb-0 w-100">
                          No hay métodos de pago disponibles. Debes crear al
                          menos un método de pago para poder crear órdenes.
                        </Alert>
                      ) : (
                        paymentMethods.map((method) => {
                          // Deshabilitar método "Efectivo" para usuarios de Redes
                          const isDisabled =
                            isSocialMedia &&
                            method.name.toLowerCase() === "efectivo";

                          return (
                            <Button
                              key={method._id}
                              variant={
                                formData.paymentMethod === method._id
                                  ? "primary"
                                  : "outline-secondary"
                              }
                              size="sm"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  paymentMethod: method._id,
                                })
                              }
                              disabled={isDisabled}
                              className="px-3"
                              title={
                                isDisabled
                                  ? "Los usuarios de Redes Sociales no pueden usar efectivo"
                                  : ""
                              }
                            >
                              {method.name}
                            </Button>
                          );
                        })
                      )}
                    </div>
                    {isSocialMedia && (
                      <Alert variant="warning" className="mt-2 mb-0 py-2">
                        <small>
                          ℹ️ Los usuarios de Redes Sociales no pueden usar el
                          método de pago "Efectivo"
                        </small>
                      </Alert>
                    )}
                  </Col>

                  <Col md={12}>
                    <hr />
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Descuento</Form.Label>
                      <div className="input-group">
                        <Form.Control
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.discount}
                          onChange={(e) =>
                            handleDiscountChange(
                              parseFloat(e.target.value) || 0,
                              formData.discountType || "porcentaje"
                            )
                          }
                          className="py-2"
                          placeholder="Ingresa el descuento"
                        />
                        <Form.Select
                          value={formData.discountType}
                          onChange={(e) =>
                            handleDiscountChange(
                              formData.discount || 0,
                              e.target.value as "porcentaje" | "cantidad"
                            )
                          }
                          style={{ maxWidth: "100px" }}
                        >
                          <option value="porcentaje">%</option>
                          <option value="cantidad">$</option>
                        </Form.Select>
                        {formData.discount > 0 && (
                          <>
                            <Button
                              variant="warning"
                              onClick={() => setShowDiscountRequestDialog(true)}
                              className="d-flex align-items-center gap-2"
                              style={{ whiteSpace: "nowrap" }}
                            >
                              <Shield size={16} />
                              {hasPendingDiscountAuth
                                ? "Modificar Solicitud"
                                : "Solicitar Autorización"}
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => {
                                handleDiscountChange(0, "porcentaje");
                                setHasPendingDiscountAuth(false);
                                setDiscountRequestMessage("");
                              }}
                              className="d-flex align-items-center gap-2 mt-1"
                              style={{ whiteSpace: "nowrap" }}
                              title="Cancelar descuento"
                            >
                              <Trash2 size={16} />
                              Cancelar Descuento
                            </Button>
                          </>
                        )}
                      </div>
                      <Alert
                        variant={hasPendingDiscountAuth ? "warning" : "info"}
                        className="mt-2 mb-0 py-2"
                      >
                        <small>
                          {hasPendingDiscountAuth
                            ? "⚠️ Descuento pendiente de autorización. Puedes modificarlo antes de crear la orden."
                            : "ℹ️ Ingresa el descuento y solicita autorización antes de crear la orden."}
                        </small>
                      </Alert>
                    </Form.Group>
                  </Col>

                      <Col md={6}>
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-muted">Subtotal</span>
                          <span className="fw-semibold">
                            ${formData.subtotal.toFixed(2)}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-muted">Descuento</span>
                          <span className="text-danger fw-semibold">
                            -$
                            {(formData.discountType === "porcentaje"
                              ? (formData.subtotal * (formData.discount || 0)) /
                                100
                              : formData.discount || 0
                            ).toFixed(2)}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-muted">Envío</span>
                          <span className="text-success fw-semibold">
                            +$
                            {(formData.deliveryData.deliveryPrice || 0).toFixed(
                              2
                            )}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center border-top pt-2">
                          <span className="fs-5 fw-bold">Total</span>
                          <span className="fs-4 fw-bold text-primary">
                            ${formData.total.toFixed(2)}
                          </span>
                        </div>
                      </Col>

                      <Col md={3}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">
                            Anticipo
                          </Form.Label>
                          <Form.Control
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.advance}
                            onChange={(e) =>
                              handleAdvanceChange(
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="py-2"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">
                            Pagó con
                          </Form.Label>
                          <Form.Control
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.paidWith}
                            onChange={(e) =>
                              handlePaidWithChange(
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="py-2"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">
                            Cambio
                          </Form.Label>
                          <Form.Control
                            type="text"
                            value={`$${(formData.change || 0).toFixed(2)}`}
                            disabled
                            className="py-2 bg-light"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Saldo</Form.Label>
                          <Form.Control
                            type="text"
                            value={`$${(formData.remainingBalance || 0).toFixed(
                              2
                            )}`}
                            disabled
                            className="py-2 bg-light fw-bold"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={12}>
                        <Form.Check
                          type="checkbox"
                          id="enviar-produccion"
                          label="Enviar a producción"
                          checked={formData.sendToProduction}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sendToProduction: e.target.checked,
                            })
                          }
                          className="mt-1"
                        />
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="outline-secondary"
              onClick={() => setShowOrderDetailsModal(false)}
              disabled={loading || uploadingFiles}
            >
              Seguir agregando
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={
                loading ||
                uploadingFiles ||
                formData.items.length === 0 ||
                !formData.paymentMethod ||
                !cashRegister ||
                (formData.items.some((item) => item.isProduct === true) &&
                  !selectedStorageId) ||
                (isSocialMedia && !formData.branchId)
              }
            >
              {uploadingFiles
                ? "Subiendo archivos..."
                : loading
                ? "Procesando..."
                : "Confirmar venta"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal de Solicitud de Autorización de Descuento */}
      <Modal
        show={showDiscountRequestDialog}
        onHide={() => {
          setShowDiscountRequestDialog(false);
          setDiscountRequestMessage("");
        }}
        centered
      >
        <Modal.Header closeButton className="bg-warning text-white">
          <Modal.Title className="d-flex align-items-center gap-2">
            <Shield size={24} />
            Confirmar Solicitud de Descuento
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info" className="mb-3">
            <strong>ℹ️ Información:</strong> El descuento se aplicará
            inmediatamente a la orden, pero necesita autorización del gerente
            antes de enviarse a producción.
          </Alert>

          <div className="mb-3 p-3 border rounded bg-light">
            <h6 className="fw-bold mb-2">Descuento solicitado:</h6>
            <p className="mb-0 fs-5 text-primary">
              {formData.discount}{" "}
              {formData.discountType === "porcentaje" ? "%" : "$"}
            </p>
          </div>

          <Form.Group>
            <Form.Label className="fw-semibold">
              Motivo de la solicitud <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Describe el motivo por el cual solicitas este descuento..."
              value={discountRequestMessage}
              onChange={(e) => setDiscountRequestMessage(e.target.value)}
              required
            />
            <Form.Text className="text-muted">
              El gerente recibirá esta solicitud junto con la orden creada. Si
              la rechaza, la orden será cancelada automáticamente.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowDiscountRequestDialog(false);
              setDiscountRequestMessage("");
            }}
            disabled={requestingDiscount}
          >
            Cancelar
          </Button>
          <Button
            variant="warning"
            onClick={handleRequestDiscountAuth}
            disabled={requestingDiscount || !discountRequestMessage.trim()}
            className="d-flex align-items-center gap-2"
          >
            <Shield size={16} />
            {requestingDiscount ? "Aplicando..." : "Aplicar y Continuar"}
          </Button>
        </Modal.Footer>
      </Modal>

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
    </div>
  );
};

export default NewOrderPage;
