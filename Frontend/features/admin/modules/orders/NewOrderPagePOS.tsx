"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Shield,
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
import {
  generateSaleTicket,
  SaleTicketData,
} from "./utils/generateSaleTicket";
import { discountAuthService } from "@/features/admin/modules/discount-auth/services/discountAuth";
import { uploadComprobante, uploadArreglo } from "@/services/firebaseStorage";
import { productCategoriesService } from "@/features/admin/modules/productCategories/services/productCategories";
import { ProductCategory } from "@/features/admin/modules/productCategories/types";

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
  const [companyBranches, setCompanyBranches] = useState<Branch[]>([]);
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
    orderDate: new Date().toISOString().slice(0, 16),
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

  // Obtener todos los clientes
  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const response = await clientsService.getAllClients({
        limit: 1000,
        status: true,
      });
      setClients(response.data);
    } catch (err) {
      console.error("Error al cargar clientes:", err);
    } finally {
      setLoadingClients(false);
    }
  };

  // Obtener todos los metodos de pago
  const fetchPaymentMethods = async () => {
    setLoadingPaymentMethods(true);
    try {
      const response = await paymentMethodsService.getAllPaymentMethods({
        limit: 1000,
        status: true,
      });
      setPaymentMethods(response.data);
      if (response.data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          paymentMethod: response.data[0]._id,
        }));
      }
    } catch (err) {
      console.error("Error al cargar metodos de pago:", err);
      toast.error("Error al cargar los metodos de pago");
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

  // Obtener almacen por sucursal
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
      console.error("Error al cargar almacen:", err);
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

  // Obtener categorias de productos activas
  const fetchProductCategories = async () => {
    setLoadingProductCategories(true);
    try {
      const response = await productCategoriesService.getAllProductCategories({
        limit: 1000,
        isActive: true,
      });
      setProductCategories(response.data);
    } catch (err) {
      console.error("Error al cargar categorias de productos:", err);
      toast.error("Error al cargar las categorias de productos");
    } finally {
      setLoadingProductCategories(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchClients();
    fetchPaymentMethods();

    if (isSocialMedia) {
      fetchCompanyBranches();
    } else {
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
        socialMedia: "whatsapp",
        salesChannel: "whatsapp",
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
      cashRegisterId: null,
    }));
    setSelectedCashRegisterId("");

    if (isSocialMedia && branchId) {
      fetchAvailableCashRegisters(branchId);
    }
  };

  // Manejar seleccion de caja registradora
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
        if (formData.branchId) {
          await fetchAvailableCashRegisters(formData.branchId);
        }
        await fetchUserCashRegister();
      }
    } catch (err: any) {
      console.error("Error al abrir caja:", err);
      toast.error(err.message || "Error al abrir la caja");
    } finally {
      setTogglingCashRegister(false);
    }
  };

  // Actualizar fecha y hora cuando se activa "Venta Rapida"
  useEffect(() => {
    if (formData.quickSale) {
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

  // Manejar seleccion de cliente
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);

    if (!clientId) {
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

  // Funcion helper para recalcular totales
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
      setError("Por favor selecciona una categoria para el producto");
      toast.error("Debes seleccionar una categoria para el producto");
      return;
    }

    const newItem: OrderItem = {
      ...currentItem,
      isProduct: false,
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

    if (itemToRemove.isProduct && itemToRemove.productId && storage) {
      try {
        const response = await storageService.releaseStock(storage._id, {
          productId: itemToRemove.productId,
          quantity: itemToRemove.quantity,
        });

        setStorage(response.data);
      } catch (err: any) {
        console.error("Error al liberar stock:", err);
        toast.error(err.message || "Error al liberar el stock");
        return;
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

  // Abrir modal de extras para un item especifico
  const handleOpenExtrasModal = (index: number) => {
    if (!storage) {
      toast.error("No hay almacen configurado");
      return;
    }

    setSelectedItemIndexForExtras(index);
    setShowAddExtrasModal(true);
  };

  // Agregar extras (materiales) a un item especifico
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
      toast.error("Item no valido");
      return;
    }

    if (!storage) {
      toast.error("No hay almacen configurado");
      return;
    }

    try {
      for (const extra of extras) {
        await storageService.removeMaterialsFromStorage(storage._id, {
          materials: [{ materialId: extra.materialId, quantity: extra.quantity }],
        });
      }

      const updatedStorage = await storageService.getStorageById(storage._id);
      setStorage(updatedStorage.data);

      const updatedItems = [...formData.items];
      const currentItem = updatedItems[selectedItemIndexForExtras];

      const newInsumos = extras.map((extra) => ({
        nombre: extra.name,
        cantidad: extra.quantity,
        importeVenta: extra.price * extra.quantity,
        isExtra: true,
      }));

      currentItem.insumos = [...(currentItem.insumos || []), ...newInsumos];

      const insumosTotal = currentItem.insumos.reduce(
        (sum, insumo) => sum + (insumo.isExtra ? insumo.importeVenta : 0),
        0
      );
      currentItem.amount =
        currentItem.unitPrice * currentItem.quantity + insumosTotal;

      updatedItems[selectedItemIndexForExtras] = currentItem;

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
    const changeAmount = paidWith - (formData.advance || 0);

    setFormData({
      ...formData,
      paidWith: paidWith,
      change: changeAmount > 0 ? changeAmount : 0,
    });
  };

  // Manejar solicitud de permiso de descuento
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

    setHasPendingDiscountAuth(true);
    setShowDiscountRequestDialog(false);

    toast.success(
      "Descuento aplicado. Se creara la solicitud al guardar la orden."
    );
  };

  // Manejar cambio de tipo de envio
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

  // Agregar producto desde catalogo
  const handleAddProductFromCatalog = async (
    product: any,
    quantity: number
  ) => {
    if (!storage) {
      toast.error(
        "No hay almacen asignado a esta sucursal. No puedes agregar productos del catalogo sin stock disponible."
      );
      return;
    }

    const productInStorage = storage.products.find(
      (p: any) => p.productId._id === product._id
    );

    if (!productInStorage) {
      toast.error(
        `El producto "${product.nombre}" no esta disponible en este almacen`
      );
      return;
    }

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
      const response = await storageService.reserveStock(storage._id, {
        productId: product._id,
        quantity,
      });

      setStorage(response.data);

      const newItem: OrderItem = {
        isProduct: true,
        productId: product._id,
        productName: product.nombre,
        quantity,
        unitPrice: product.precio,
        amount: quantity * product.precio,
        productCategory: product.productCategory ?? null,
        insumos: (product.insumos || []).map((insumo: any) => ({
          ...insumo,
          importeVenta: 0,
          isExtra: false,
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
      const companyResponse = await companiesService.getCompanyByBranchId(
        orderData.branchId._id
      );

      if (!companyResponse.success || !companyResponse.data) {
        throw new Error("No se pudieron obtener los datos de la empresa");
      }

      const selectedPaymentMethod = paymentMethods.find(
        (pm) =>
          pm._id ===
          (typeof orderData.paymentMethod === "string"
            ? orderData.paymentMethod
            : orderData.paymentMethod._id)
      );

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

      const ticketHTML = generateSaleTicket(ticketData);

      const printWindow = window.open("", "_blank", "width=800,height=600");

      if (printWindow) {
        printWindow.document.write(ticketHTML);
        printWindow.document.close();

        printWindow.onload = () => {
          printWindow.focus();
        };
      } else {
        toast.error(
          "No se pudo abrir la ventana de impresion. Verifica que no este bloqueada por el navegador."
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
      if (!cashRegister) {
        throw new Error(
          "Debes tener una caja registradora asignada para crear ordenes"
        );
      }

      if (!cashRegister.isOpen) {
        throw new Error(
          "La caja registradora debe estar abierta para crear ordenes"
        );
      }

      const hasProductsFromCatalog = formData.items.some(
        (item) => item.isProduct === true
      );

      if (hasProductsFromCatalog && !selectedStorageId) {
        throw new Error(
          "Hay productos del catalogo en la orden pero no hay almacen asignado a la sucursal"
        );
      }

      if (!formData.paymentMethod) {
        throw new Error("Debes seleccionar un metodo de pago");
      }

      if (isSocialMedia && !formData.branchId) {
        throw new Error(
          "Debes seleccionar una sucursal antes de crear la orden"
        );
      }

      if (isSocialMedia && cashRegister && !cashRegister.isSocialMediaBox) {
        throw new Error(
          "Los usuarios de Redes Sociales deben usar cajas de redes sociales"
        );
      }

      const orderData = {
        ...formData,
        storageId: selectedStorageId || null,
        salesChannel: isCashier ? "tienda" : formData.salesChannel,
        hasPendingDiscountAuth,
      };

      const response = await ordersService.createOrder(orderData);

      if (!response || !response.success) {
        throw new Error(response?.message || "Error al crear la orden");
      }

      if (!response.data) {
        throw new Error("No se recibio respuesta del servidor");
      }

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
            "Orden creada pero hubo un error al subir los archivos. Puedes intentar subirlos despues."
          );
        } finally {
          setUploadingFiles(false);
        }
      }

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

      toast.success(
        `Orden ${response.data.orderNumber || ""} creada exitosamente!`
      );

      generateAndPrintSaleTicket(response.data);

      setSuccess(true);

      setTimeout(() => {
        setFormData({
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
          orderDate: new Date().toISOString().slice(0, 16),
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
    <div className="new-order-page">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Formulario - 65% izquierda */}
        <div className="lg:col-span-8 order-2 lg:order-1">
          {error && (
            <Alert
              variant="destructive"
              className="mb-3"
            >
              <AlertDescription className="flex justify-between items-center">
                {error}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                >
                  X
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-3 border-green-500 bg-green-50">
              <AlertDescription className="flex justify-between items-center text-green-700">
                Pedido creado exitosamente!
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSuccess(false)}
                >
                  X
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {hasNoStorage && (
            <Alert className="mb-3 flex items-center gap-2 border-yellow-500 bg-yellow-50">
              <Package size={20} className="text-yellow-600" />
              <AlertDescription>
                <strong>No hay almacen asignado a esta sucursal</strong>
                <p className="mb-0 text-sm">
                  Los productos del catalogo se mostraran con stock en 0. Para
                  poder crear ordenes con productos del catalogo, necesitas
                  crear un almacen para esta sucursal.
                </p>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {/* Selector de Sucursal - Solo para usuarios Redes */}
            {isSocialMedia && (
              <Card className="mb-4 shadow-sm">
                <CardHeader className="bg-primary text-white py-3 rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <Store size={20} />
                    <h5 className="mb-0 font-bold">Seleccionar Sucursal</h5>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <Alert className="mb-3 border-blue-500 bg-blue-50">
                    <AlertDescription className="text-blue-700">
                      <strong>Importante:</strong> Debes seleccionar una
                      sucursal antes de agregar productos. Los productos y
                      almacenes disponibles dependen de la sucursal seleccionada.
                    </AlertDescription>
                  </Alert>
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
                    {companyBranches.length === 0 &&
                      !loadingCompanyBranches && (
                        <Alert className="mt-2 py-2 border-yellow-500 bg-yellow-50">
                          <AlertDescription className="text-yellow-700 text-sm">
                            No hay sucursales asignadas a tu empresa. Contacta
                            al administrador.
                          </AlertDescription>
                        </Alert>
                      )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selector de Caja - Solo para usuarios Redes despues de seleccionar sucursal */}
            {isSocialMedia && formData.branchId && (
              <Card className="mb-4 shadow-sm">
                <CardHeader className="bg-green-600 text-white py-3 rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <CreditCard size={20} />
                    <h5 className="mb-0 font-bold">Seleccionar Caja</h5>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <Alert className="mb-3 border-blue-500 bg-blue-50">
                    <AlertDescription className="text-blue-700">
                      <strong>Informacion:</strong> Selecciona una caja de
                      redes sociales de esta sucursal. Si no tienes una caja
                      abierta, puedes abrir una directamente desde aqui.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <Label className="font-semibold flex items-center gap-2 mb-2">
                        <CreditCard size={16} />
                        Caja Registradora
                      </Label>
                      <Select
                        value={selectedCashRegisterId}
                        onValueChange={(value) =>
                          handleCashRegisterSelect(value)
                        }
                        disabled={loadingAvailableCashRegisters}
                      >
                        <SelectTrigger className="py-2">
                          <SelectValue
                            placeholder={
                              loadingAvailableCashRegisters
                                ? "Cargando cajas..."
                                : "-- Selecciona una caja --"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCashRegisters.map((cr) => (
                            <SelectItem key={cr._id} value={cr._id}>
                              {cr.name} -{" "}
                              {cr.isOpen ? "Abierta" : "Cerrada"}
                              {cr.cashierId
                                ? ` (${cr.cashierId.username})`
                                : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {availableCashRegisters.length === 0 &&
                        !loadingAvailableCashRegisters && (
                          <Alert className="mt-2 py-2 border-yellow-500 bg-yellow-50">
                            <AlertDescription className="text-yellow-700 text-sm">
                              No hay cajas de redes sociales disponibles en
                              esta sucursal. Contacta al administrador.
                            </AlertDescription>
                          </Alert>
                        )}
                    </div>

                    {selectedCashRegisterId &&
                      !availableCashRegisters.find(
                        (cr) => cr._id === selectedCashRegisterId && cr.isOpen
                      ) && (
                        <div className="flex items-end">
                          <Button
                            type="button"
                            onClick={handleOpenCashRegister}
                            disabled={togglingCashRegister}
                            className="w-full py-2 bg-green-600 hover:bg-green-700"
                          >
                            {togglingCashRegister
                              ? "Abriendo..."
                              : "Abrir Caja"}
                          </Button>
                        </div>
                      )}
                  </div>

                  {cashRegister?.isOpen &&
                    cashRegister.branchId?._id === formData.branchId && (
                      <Alert className="mt-3 border-green-500 bg-green-50">
                        <AlertDescription className="text-green-700">
                          <strong>Caja Abierta:</strong> {cashRegister.name} -
                          Esta caja esta lista para crear ordenes.
                        </AlertDescription>
                      </Alert>
                    )}
                  {cashRegister?.isOpen &&
                    cashRegister.branchId?._id !== formData.branchId && (
                      <Alert className="mt-3 border-blue-500 bg-blue-50">
                        <AlertDescription className="text-blue-700">
                          <strong>
                            Tienes una caja abierta en otra sucursal:
                          </strong>{" "}
                          {cashRegister.name} (
                          {cashRegister.branchId?.branchName ||
                            "Sucursal desconocida"}
                          ). Selecciona una caja de esta sucursal para crear
                          ordenes aqui.
                        </AlertDescription>
                      </Alert>
                    )}
                </CardContent>
              </Card>
            )}

            {/* Informacion del Cliente */}
            <Card className="mb-4 shadow-sm">
              <CardHeader className="bg-white py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User size={20} className="text-primary" />
                    <h5 className="mb-0 font-bold">Informacion del Cliente</h5>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClientInfo(!showClientInfo)}
                    className="flex items-center gap-2 mx-2"
                  >
                    {showClientInfo ? (
                      <>
                        <EyeOff size={16} />
                        Ocultar Detalles
                      </>
                    ) : (
                      <>
                        <Eye size={16} />
                        Ver Detalles
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Campos siempre visibles */}
                  <div>
                    <Label className="font-semibold flex items-center gap-2 mb-2">
                      <Search size={16} />
                      Buscar Cliente Existente
                    </Label>
                    <Select
                      value={selectedClientId}
                      onValueChange={(value) => handleClientSelect(value)}
                      disabled={loadingClients}
                    >
                      <SelectTrigger className="py-2">
                        <SelectValue placeholder="Seleccionar cliente o ingresar nuevo..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Seleccionar cliente o ingresar nuevo...</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client._id} value={client._id}>
                            {client.name} {client.lastName} -{" "}
                            {client.phoneNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Informacion de caja registradora - Solo para usuarios Cajero */}
                  {!isSocialMedia && (
                    <div>
                      <Label className="font-semibold flex items-center gap-2 mb-2">
                        <CreditCard size={16} />
                        Caja Registradora
                      </Label>
                      <div className="flex gap-2">
                        <Input
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
                          className="py-2 bg-gray-100"
                        />
                        {cashRegister ? (
                          <Badge
                            variant={cashRegister.isOpen ? "default" : "secondary"}
                            className={`flex items-center justify-center py-2 px-3 min-w-[120px] ${cashRegister.isOpen ? 'bg-green-500' : ''}`}
                          >
                            {cashRegister.isOpen
                              ? "Abierta"
                              : "Cerrada"}
                          </Badge>
                        ) : (
                          !loadingCashRegister && (
                            <Button
                              type="button"
                              onClick={() => router.push("/ventas/cajas")}
                              className="flex items-center gap-2 min-w-[160px]"
                            >
                              <ExternalLink size={16} />
                              Ir a Cajas
                            </Button>
                          )
                        )}
                      </div>
                      {cashRegister && !cashRegister.isOpen && (
                        <Alert className="mt-2 py-2 border-yellow-500 bg-yellow-50">
                          <AlertDescription className="text-yellow-700 text-sm">
                            La caja esta cerrada. Dirigete a la pagina de
                            Cajas para abrirla.
                          </AlertDescription>
                        </Alert>
                      )}
                      {!cashRegister && !loadingCashRegister && (
                        <Alert className="mt-2 py-2 border-blue-500 bg-blue-50">
                          <AlertDescription className="text-blue-700 text-sm">
                            No tienes una caja asignada. Dirigete a la
                            pagina de Cajas Registradoras para abrir una.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  {/* Detalles del cliente - solo visibles cuando showClientInfo es true */}
                  {showClientInfo && (
                    <>
                      <div>
                        <Label className="font-semibold flex items-center gap-2 mb-2">
                          <User size={16} />
                          Cliente
                        </Label>
                        <Input
                          type="text"
                          placeholder="Nombre del cliente"
                          value={formData.clientInfo.name}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              clientInfo: {
                                ...formData.clientInfo,
                                name: e.target.value,
                              },
                            });
                            setSelectedClientId("");
                          }}
                          required
                          className="py-2"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="font-semibold flex items-center gap-2 mb-2">
                            <Phone size={16} />
                            Telefono
                          </Label>
                          <Input
                            type="tel"
                            placeholder="Telefono"
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
                        </div>

                        <div>
                          <Label className="font-semibold flex items-center gap-2 mb-2">
                            <Mail size={16} />
                            Correo
                          </Label>
                          <Input
                            type="email"
                            placeholder="Correo electronico"
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
                        </div>
                      </div>

                      {/* Solo mostrar Canal de Venta si NO es usuario de Redes ni Cajero */}
                      {!isSocialMedia && !isCashier && (
                        <div className="md:col-span-2">
                          <Label className="font-semibold flex items-center gap-2 mb-2">
                            <Store size={16} />
                            Canal de Venta
                          </Label>
                          <Select
                            value={formData.salesChannel}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                salesChannel: value as
                                  | "tienda"
                                  | "whatsapp"
                                  | "facebook"
                                  | "instagram",
                              })
                            }
                          >
                            <SelectTrigger className="py-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tienda">Tienda</SelectItem>
                              <SelectItem value="whatsapp">WhatsApp</SelectItem>
                              <SelectItem value="facebook">Facebook</SelectItem>
                              <SelectItem value="instagram">Instagram</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Productos */}
            <Card className="mb-4 shadow-sm">
              <CardHeader className="bg-white py-3">
                <div className="flex items-center gap-2">
                  <Package size={20} className="text-primary" />
                  <h5 className="mb-0 font-bold">Productos</h5>
                </div>
              </CardHeader>
              <CardContent>
                {/* Primera fila: Nombre del Producto y Categoria */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <Label className="font-semibold mb-2">
                      Nombre del Producto
                    </Label>
                    <Input
                      type="text"
                      placeholder="Nombre del producto"
                      value={currentProductName}
                      onChange={(e) => setCurrentProductName(e.target.value)}
                      className="py-2"
                    />
                  </div>

                  <div>
                    <Label className="font-semibold mb-2">
                      Categoria <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={selectedProductCategory}
                      onValueChange={(value) => {
                        setSelectedProductCategory(value);
                        console.log(value);
                      }}
                      disabled={loadingProductCategories}
                    >
                      <SelectTrigger className="py-2">
                        <SelectValue
                          placeholder={
                            loadingProductCategories
                              ? "Cargando..."
                              : "-- Selecciona categoria --"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {productCategories.map((category) => (
                          <SelectItem key={category._id} value={category._id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {productCategories.length === 0 &&
                      !loadingProductCategories && (
                        <p className="text-yellow-600 text-sm mt-1">
                          No hay categorias disponibles. Por favor, crea
                          una categoria primero.
                        </p>
                      )}
                  </div>
                </div>

                {/* Segunda fila: Cantidad, Precio, Importe y Boton Agregar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 items-end">
                  <div>
                    <Label className="font-semibold mb-2">Cantidad</Label>
                    <Input
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
                  </div>

                  <div>
                    <Label className="font-semibold mb-2">Precio</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={currentItem.unitPrice || ""}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          unitPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="py-2"
                    />
                  </div>

                  <div>
                    <Label className="font-semibold mb-2">Importe</Label>
                    <Input
                      type="text"
                      value={`$${calculateItemAmount().toFixed(2)}`}
                      disabled
                      className="py-2 bg-gray-100"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full py-2 flex items-center justify-center gap-2"
                    >
                      <Plus size={20} />
                      <span>Agregar</span>
                    </Button>
                  </div>
                </div>

                {/* Lista de items */}
                {formData.items.length > 0 && (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead style={{ width: "10%" }}>Cantidad</TableHead>
                          <TableHead style={{ width: "40%" }}>Nombre del Producto</TableHead>
                          <TableHead style={{ width: "10%" }}>Tipo</TableHead>
                          <TableHead style={{ width: "15%" }}>Precio Unit.</TableHead>
                          <TableHead style={{ width: "15%" }}>Importe</TableHead>
                          <TableHead style={{ width: "12%" }} className="text-center">
                            Acciones
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.items.map((item, index) => (
                          <React.Fragment key={index}>
                            {/* Fila principal del producto */}
                            <TableRow>
                              <TableCell className="align-top py-3">
                                {item.quantity}
                              </TableCell>
                              <TableCell className="py-3">
                                <div className="font-semibold">
                                  {item.productName}
                                </div>
                              </TableCell>
                              <TableCell className="align-top py-3">
                                <Badge
                                  variant={item.isProduct ? "default" : "secondary"}
                                  className={item.isProduct ? 'bg-green-500' : ''}
                                >
                                  {item.isProduct ? "Existente" : "Manual"}
                                </Badge>
                              </TableCell>
                              <TableCell className="align-top py-3 text-right">
                                ${item.unitPrice.toFixed(2)}
                              </TableCell>
                              <TableCell className="align-top py-3 font-bold text-right">
                                ${item.amount.toFixed(2)}
                              </TableCell>
                              <TableCell className="align-top py-3 text-center">
                                <div className="flex gap-1 justify-center">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenExtrasModal(index)}
                                    title="Agregar extras"
                                    disabled={!storage || !storage.materials || storage.materials.length === 0}
                                  >
                                    <Plus size={16} />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleRemoveItem(index)}
                                    title="Eliminar producto"
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                            {/* Filas de insumos */}
                            {item.insumos &&
                              item.insumos.length > 0 &&
                              item.insumos.map((insumo, idx) => (
                                <TableRow
                                  key={`${index}-insumo-${idx}`}
                                  className=""
                                >
                                  <TableCell className="py-1 pl-10">
                                    {insumo.cantidad}
                                  </TableCell>
                                  <TableCell className="py-1 pl-10 font-bold">
                                    {insumo.nombre}
                                  </TableCell>
                                  <TableCell className="py-1">
                                    {insumo.isExtra && (
                                      <Badge variant="default" className="bg-blue-500">
                                        Extra
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="py-1 text-right">
                                    ${insumo.importeVenta.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="py-1"></TableCell>
                                  <TableCell className="py-1"></TableCell>
                                </TableRow>
                              ))}
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tipo de Envio */}
            <Card className="mb-4 shadow-sm">
              <CardHeader className="bg-white py-3">
                <div className="flex items-center gap-2">
                  <Send size={20} className="text-primary" />
                  <h5 className="mb-0 font-bold">Tipo de Envio</h5>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {/* Para usuarios de Redes, mostrar solo "Redes Sociales" y el select de plataforma */}
                  {isSocialMedia ? (
                    <>
                      <Alert className="border-blue-500 bg-blue-50">
                        <AlertDescription className="text-blue-700">
                          Como usuario de Redes Sociales, solo puedes crear
                          ordenes de tipo "Redes Sociales"
                        </AlertDescription>
                      </Alert>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="font-semibold flex items-center gap-2 mb-2">
                            <Store size={16} />
                            Tipo de Envio
                          </Label>
                          <Input
                            type="text"
                            value="Redes Sociales"
                            disabled
                            className="py-2 bg-gray-100"
                          />
                        </div>
                        <div>
                          <Label className="font-semibold flex items-center gap-2 mb-2">
                            <Store size={16} />
                            Plataforma de Redes Sociales
                          </Label>
                          <Select
                            value={formData.socialMedia || "whatsapp"}
                            onValueChange={(value) => {
                              const platform = value as
                                | "whatsapp"
                                | "facebook"
                                | "instagram";
                              setFormData({
                                ...formData,
                                socialMedia: platform,
                                salesChannel: platform,
                              });
                            }}
                          >
                            <SelectTrigger className="py-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="whatsapp">WhatsApp</SelectItem>
                              <SelectItem value="facebook">Facebook</SelectItem>
                              <SelectItem value="instagram">Instagram</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Para usuarios normales, mostrar opciones de envio tradicionales */
                    <div className="flex gap-4 flex-wrap items-center">
                      {["envio", "tienda"].map((tipo) => (
                        <div key={tipo} className="flex items-center gap-2">
                          <input
                            type="radio"
                            id={`envio-${tipo}`}
                            name="envio"
                            value={tipo}
                            checked={formData.shippingType === tipo}
                            onChange={(e) =>
                              handleShippingTypeChange(
                                e.target.value as ShippingType
                              )
                            }
                            className="w-4 h-4"
                          />
                          <label htmlFor={`envio-${tipo}`}>
                            {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                          </label>
                        </div>
                      ))}

                      <div className="border-l pl-3 flex gap-3">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="anonimo-check"
                            checked={formData.anonymous}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                anonymous: checked === true,
                              })
                            }
                          />
                          <label htmlFor="anonimo-check">Anonimo</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="venta-rapida-check"
                            checked={formData.quickSale}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                quickSale: checked === true,
                              })
                            }
                          />
                          <label htmlFor="venta-rapida-check">Venta Rapida</label>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="font-semibold flex items-center gap-2 mb-2">
                        <User size={16} />
                        Nombre de quien recibe
                      </Label>
                      <Input
                        type="text"
                        placeholder="Nombre del receptor"
                        value={formData.deliveryData.recipientName}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            deliveryData: {
                              ...formData.deliveryData,
                              recipientName: e.target.value,
                            },
                          });
                        }}
                        required
                        className="py-2"
                      />
                    </div>

                    <div>
                      <Label className="font-semibold flex items-center gap-2 mb-2">
                        <Calendar size={16} />
                        Fecha y Hora de Entrega
                      </Label>
                      <Input
                        type="datetime-local"
                        value={formData.deliveryData.deliveryDateTime}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            deliveryData: {
                              ...formData.deliveryData,
                              deliveryDateTime: e.target.value,
                            },
                          });
                        }}
                        min={new Date().toISOString().slice(0, 16)}
                        required
                        className="py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="font-semibold flex items-center gap-2 mb-2">
                      <MessageSquare size={16} />
                      Mensaje / Comentario
                    </Label>
                    <Textarea
                      rows={3}
                      placeholder="Escribe el mensaje en la tarjeta o algun comentario"
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
                  </div>

                  {/* Campos de direccion solo para tipo de envio "envio" */}
                  {formData.shippingType === "envio" && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="font-semibold mb-2">
                            Calle y Numero
                          </Label>
                          <Input
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
                        </div>

                        <div>
                          <Label className="font-semibold mb-2">
                            Colonia
                          </Label>
                          <Select
                            value={formData.deliveryData.neighborhoodId}
                            onValueChange={(value) =>
                              handleNeighborhoodChange(value)
                            }
                            disabled={loadingNeighborhoods}
                          >
                            <SelectTrigger className="py-2">
                              <SelectValue placeholder="Seleccionar colonia..." />
                            </SelectTrigger>
                            <SelectContent>
                              {neighborhoods.map((neighborhood) => (
                                <SelectItem
                                  key={neighborhood._id}
                                  value={neighborhood._id}
                                >
                                  {neighborhood.name} - $
                                  {neighborhood.priceDelivery.toFixed(2)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="font-semibold mb-2">
                          Senas o Referencias
                        </Label>
                        <Textarea
                          rows={2}
                          placeholder="Ej: Casa blanca con porton negro, entre calle X y Y"
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
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="font-semibold flex items-center gap-2 mb-2">
                        <Upload size={16} />
                        Adjunte el comprobante
                      </Label>
                      <Input
                        type="file"
                        className="py-2"
                        accept="image/*,.pdf"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setComprobanteFile(file);
                          }
                        }}
                      />
                      {comprobanteFile && (
                        <p className="text-green-600 text-sm mt-1">
                          Archivo seleccionado: {comprobanteFile.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="font-semibold flex items-center gap-2 mb-2">
                        <Upload size={16} />
                        Adjunte arreglo
                      </Label>
                      <Input
                        type="file"
                        className="py-2"
                        accept="image/*"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setArregloFile(file);
                          }
                        }}
                      />
                      {arregloFile && (
                        <p className="text-green-600 text-sm mt-1">
                          Archivo seleccionado: {arregloFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Forma de Pago y Resumen */}
            <Card className="mb-4 shadow-sm">
              <CardHeader className="bg-white py-3">
                <div className="flex items-center gap-2">
                  <CreditCard size={20} className="text-primary" />
                  <h5 className="mb-0 font-bold">Forma de Pago</h5>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="font-semibold flex items-center gap-2 mb-2">
                        <Calendar size={16} />
                        Fecha y Hora de Orden
                      </Label>
                      <Input
                        type="datetime-local"
                        value={formData.orderDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            orderDate: e.target.value,
                          })
                        }
                        required
                        className="py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="font-semibold mb-2">
                      Metodo de Pago
                    </Label>
                    <div className="flex gap-2 flex-wrap">
                      {loadingPaymentMethods ? (
                        <div className="text-muted-foreground">
                          Cargando metodos de pago...
                        </div>
                      ) : paymentMethods.length === 0 ? (
                        <Alert variant="destructive" className="w-full">
                          <AlertDescription>
                            No hay metodos de pago disponibles. Debes crear al
                            menos un metodo de pago para poder crear ordenes.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        paymentMethods.map((method) => {
                          const isDisabled =
                            isSocialMedia &&
                            method.name.toLowerCase() === "efectivo";

                          return (
                            <Button
                              key={method._id}
                              type="button"
                              variant={
                                formData.paymentMethod === method._id
                                  ? "default"
                                  : "outline"
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
                      <Alert className="mt-2 py-2 border-yellow-500 bg-yellow-50">
                        <AlertDescription className="text-yellow-700 text-sm">
                          Los usuarios de Redes Sociales no pueden usar el
                          metodo de pago "Efectivo"
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <hr />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="font-semibold mb-2">Descuento</Label>
                      <div className="flex gap-2">
                        <Input
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
                        <Select
                          value={formData.discountType}
                          onValueChange={(value) =>
                            handleDiscountChange(
                              formData.discount || 0,
                              value as "porcentaje" | "cantidad"
                            )
                          }
                        >
                          <SelectTrigger className="w-[80px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="porcentaje">%</SelectItem>
                            <SelectItem value="cantidad">$</SelectItem>
                          </SelectContent>
                        </Select>
                        {(formData.discount || 0) > 0 && (
                          <>
                            <Button
                              type="button"
                              variant="default"
                              onClick={() => setShowDiscountRequestDialog(true)}
                              className="flex items-center gap-2 whitespace-nowrap bg-yellow-500 hover:bg-yellow-600"
                            >
                              <Shield size={16} />
                              {hasPendingDiscountAuth
                                ? "Modificar"
                                : "Solicitar"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                handleDiscountChange(0, "porcentaje");
                                setHasPendingDiscountAuth(false);
                                setDiscountRequestMessage("");
                              }}
                              className="flex items-center gap-2 whitespace-nowrap text-red-500 border-red-500 hover:bg-red-50"
                              title="Cancelar descuento"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </>
                        )}
                      </div>
                      <Alert
                        className={`mt-2 py-2 ${hasPendingDiscountAuth ? 'border-yellow-500 bg-yellow-50' : 'border-blue-500 bg-blue-50'}`}
                      >
                        <AlertDescription className={hasPendingDiscountAuth ? 'text-yellow-700 text-sm' : 'text-blue-700 text-sm'}>
                          {hasPendingDiscountAuth
                            ? "Descuento pendiente de autorizacion. Puedes modificarlo antes de crear la orden."
                            : "Ingresa el descuento y solicita autorizacion antes de crear la orden."}
                        </AlertDescription>
                      </Alert>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-bold">
                          ${formData.subtotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-muted-foreground">Descuento:</span>
                        <span className="text-red-500 font-bold">
                          -$
                          {(formData.discountType === "porcentaje"
                            ? (formData.subtotal * (formData.discount || 0)) / 100
                            : formData.discount || 0
                          ).toFixed(2)}
                        </span>
                      </div>
                      {formData.shippingType === "envio" &&
                        (formData.deliveryData.deliveryPrice || 0) > 0 && (
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-muted-foreground">Costo de Envio:</span>
                            <span className="text-green-500 font-bold">
                              +$
                              {(formData.deliveryData.deliveryPrice || 0).toFixed(
                                2
                              )}
                            </span>
                          </div>
                        )}
                      <div className="flex justify-between items-center py-2 border-t">
                        <span className="text-lg font-bold">Total:</span>
                        <span className="text-xl font-bold text-primary">
                          ${formData.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <hr />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="font-semibold mb-2">Anticipo</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.advance}
                        onChange={(e) =>
                          handleAdvanceChange(parseFloat(e.target.value) || 0)
                        }
                        className="py-2"
                      />
                    </div>

                    <div>
                      <Label className="font-semibold mb-2">Pago con</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.paidWith}
                        onChange={(e) =>
                          handlePaidWithChange(parseFloat(e.target.value) || 0)
                        }
                        className="py-2"
                      />
                    </div>

                    <div>
                      <Label className="font-semibold mb-2">Cambio</Label>
                      <Input
                        type="text"
                        value={`$${(formData.change || 0).toFixed(2)}`}
                        disabled
                        className="py-2 bg-gray-100"
                      />
                    </div>

                    <div>
                      <Label className="font-semibold mb-2">Saldo</Label>
                      <Input
                        type="text"
                        value={`$${(formData.remainingBalance || 0).toFixed(
                          2
                        )}`}
                        disabled
                        className="py-2 bg-gray-100 font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox
                      id="enviar-produccion"
                      checked={formData.sendToProduction}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          sendToProduction: checked === true,
                        })
                      }
                    />
                    <label htmlFor="enviar-produccion">Enviar a produccion</label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Boton Aceptar */}
            <div className="flex justify-end gap-2 mb-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => window.history.back()}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
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
                className="px-10"
              >
                {uploadingFiles
                  ? "Subiendo archivos..."
                  : loading
                  ? "Procesando..."
                  : "Aceptar"}
              </Button>
            </div>
          </form>
        </div>

        {/* Catalogo de Productos - 35% derecha */}
        <div className="lg:col-span-4 order-1 lg:order-2">
          <div
            className="sticky"
            style={{ top: "20px", height: "calc(100vh - 160px)" }}
          >
            <ProductCatalog
              onAddProduct={handleAddProductFromCatalog}
              branchId={formData.branchId}
              itemsInOrder={formData.items}
              storage={storage}
              searchTerm={catalogSearchTerm}
              onSearchChange={setCatalogSearchTerm}
            />
          </div>
        </div>
      </div>

      {/* Modal de Solicitud de Autorizacion de Descuento */}
      <Dialog
        open={showDiscountRequestDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowDiscountRequestDialog(false);
            setDiscountRequestMessage("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader className="bg-yellow-500 text-white -mx-6 -mt-6 px-6 py-4 rounded-t-lg">
            <DialogTitle className="flex items-center gap-2">
              <Shield size={24} />
              Confirmar Solicitud de Descuento
            </DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            <Alert className="mb-3 border-blue-500 bg-blue-50">
              <AlertDescription className="text-blue-700">
                <strong>Informacion:</strong> El descuento se aplicara
                inmediatamente a la orden, pero necesita autorizacion del gerente
                antes de enviarse a produccion.
              </AlertDescription>
            </Alert>

            <div className="mb-3 p-3 border rounded bg-gray-50">
              <h6 className="font-bold mb-2">Descuento solicitado:</h6>
              <p className="mb-0 text-lg text-primary">
                {formData.discount}{" "}
                {formData.discountType === "porcentaje" ? "%" : "$"}
              </p>
            </div>

            <div>
              <Label className="font-semibold mb-2">
                Motivo de la solicitud <span className="text-red-500">*</span>
              </Label>
              <Textarea
                rows={4}
                placeholder="Describe el motivo por el cual solicitas este descuento..."
                value={discountRequestMessage}
                onChange={(e) => setDiscountRequestMessage(e.target.value)}
                required
              />
              <p className="text-muted-foreground text-sm mt-1">
                El gerente recibira esta solicitud junto con la orden creada. Si
                la rechaza, la orden sera cancelada automaticamente.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
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
              type="button"
              onClick={handleRequestDiscountAuth}
              disabled={requestingDiscount || !discountRequestMessage.trim()}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600"
            >
              <Shield size={16} />
              {requestingDiscount ? "Aplicando..." : "Aplicar y Continuar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
