"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { X, Plus, Trash2 } from "lucide-react";
import { storageService } from "../services/storage";
import { branchesService } from "../../branches/services/branches";
import { productsService } from "../../products/services/products";
import { Branch } from "../../branches/types";
import { Product } from "../types";

interface CreateStorageModalProps {
  show: boolean;
  onHide: () => void;
  onStorageSaved: () => void;
  branches?: Branch[];
}

interface ProductEntry {
  productId: string;
  quantity: number;
}

interface WarehouseManagerData {
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  profile: {
    name: string;
    lastName: string;
  };
}

const CreateStorageModal: React.FC<CreateStorageModalProps> = ({
  show,
  onHide,
  onStorageSaved,
  branches: propBranches,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [managerData, setManagerData] = useState<WarehouseManagerData>({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    profile: {
      name: "",
      lastName: "",
    },
  });

  const [address, setAddress] = useState({
    street: "",
    externalNumber: "",
    internalNumber: "",
    neighborhood: "",
    city: "",
    state: "",
    postalCode: "",
  });

  const [productEntries, setProductEntries] = useState<ProductEntry[]>([]);

  useEffect(() => {
    if (show) {
      loadData();
    }
  }, [show]);

  const loadData = async () => {
    try {
      setLoadingData(true);

      // Cargar sucursales si no se pasan como prop
      if (!propBranches) {
        const branchesResponse = await branchesService.getAllBranches({
          limit: 100,
        });
        setBranches(branchesResponse.data);
      } else {
        setBranches(propBranches);
      }

      // Cargar productos activos
      const productsResponse = await productsService.getAllProducts({
        limit: 1000,
        estatus: true,
      });
      setProducts(productsResponse.data);
    } catch (error: any) {
      toast.error(error.message || "Error al cargar datos");
      console.error("Error loading data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleManagerChange = (field: string, value: string) => {
    if (field.startsWith("profile.")) {
      const profileField = field.split(".")[1];
      setManagerData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          [profileField]: value,
        },
      }));
    } else {
      setManagerData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setAddress((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddProduct = () => {
    setProductEntries([...productEntries, { productId: "", quantity: 0 }]);
  };

  const handleRemoveProduct = (index: number) => {
    const newEntries = [...productEntries];
    newEntries.splice(index, 1);
    setProductEntries(newEntries);
  };

  const handleProductChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const newEntries = [...productEntries];
    newEntries[index] = {
      ...newEntries[index],
      [field]: field === "quantity" ? Number(value) : value,
    };
    setProductEntries(newEntries);
  };

  const validateForm = (): boolean => {
    // Validar sucursal
    if (!selectedBranch) {
      toast.error("Debes seleccionar una sucursal");
      return false;
    }

    // Validar datos del gerente de almacén
    if (!managerData.username || !managerData.email || !managerData.phone) {
      toast.error("Completa todos los campos del gerente de almacén");
      return false;
    }

    if (!managerData.profile.name || !managerData.profile.lastName) {
      toast.error("Completa el nombre y apellido del gerente");
      return false;
    }

    if (!managerData.password) {
      toast.error("La contraseña es requerida");
      return false;
    }

    if (managerData.password !== managerData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return false;
    }

    if (managerData.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return false;
    }

    // Validar dirección
    if (
      !address.street ||
      !address.externalNumber ||
      !address.neighborhood ||
      !address.city ||
      !address.state ||
      !address.postalCode
    ) {
      toast.error("Completa todos los campos de la dirección");
      return false;
    }

    if (address.postalCode.length !== 5) {
      toast.error("El código postal debe tener 5 dígitos");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Filtrar productos válidos
      const validProducts = productEntries.filter(
        (p) => p.productId && p.quantity > 0
      );

      // Preparar datos para enviar al backend
      const storageData: any = {
        branch: selectedBranch,
        warehouseManagerData: {
          username: managerData.username,
          email: managerData.email,
          phone: managerData.phone,
          password: managerData.password,
          profile: {
            name: managerData.profile.name,
            lastName: managerData.profile.lastName,
          },
        },
        address: address,
        products: validProducts.length > 0 ? validProducts : undefined,
      };

      await storageService.createStorage(storageData);

      toast.success("Almacén creado exitosamente");
      onStorageSaved();
      handleClose();
    } catch (error: any) {
      toast.error(error.message || "Error al crear almacén");
      console.error("Error creating storage:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedBranch("");
    setManagerData({
      username: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      profile: {
        name: "",
        lastName: "",
      },
    });
    setAddress({
      street: "",
      externalNumber: "",
      internalNumber: "",
      neighborhood: "",
      city: "",
      state: "",
      postalCode: "",
    });
    setProductEntries([]);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="xl" centered scrollable>
      <Modal.Header className="border-0 pb-0">
        <div className="w-100">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold">Crear Nuevo Almacén</h5>
            <Button
              variant="link"
              onClick={handleClose}
              className="text-muted p-0"
            >
              <X size={24} />
            </Button>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body>
        {loadingData ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="text-muted mt-2">Cargando datos...</p>
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
            {/* Sucursal */}
            <div className="mb-4">
              <h6 className="mb-3 fw-bold text-primary">
                Información del Almacén
              </h6>
              <Form.Group className="mb-3">
                <Form.Label>
                  Sucursal <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  required
                >
                  <option value="">Seleccionar sucursal...</option>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.branchName}{" "}
                      {branch.branchCode ? `(${branch.branchCode})` : ""}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>

            {/* Gerente de Almacén */}
            <div className="mb-4">
              <h6 className="mb-3 fw-bold text-primary">Gerente de Almacén</h6>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Nombre <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Nombre"
                      value={managerData.profile.name}
                      onChange={(e) =>
                        handleManagerChange("profile.name", e.target.value)
                      }
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Apellido <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Apellido"
                      value={managerData.profile.lastName}
                      onChange={(e) =>
                        handleManagerChange("profile.lastName", e.target.value)
                      }
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Teléfono <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="tel"
                      placeholder="1234567890"
                      value={managerData.phone}
                      onChange={(e) =>
                        handleManagerChange("phone", e.target.value)
                      }
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Email <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={managerData.email}
                      onChange={(e) =>
                        handleManagerChange("email", e.target.value)
                      }
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Nombre de Usuario <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Nombre de usuario"
                      value={managerData.username}
                      onChange={(e) =>
                        handleManagerChange("username", e.target.value)
                      }
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Contraseña <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={managerData.password}
                      onChange={(e) =>
                        handleManagerChange("password", e.target.value)
                      }
                      required
                      minLength={6}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Confirmar Contraseña{" "}
                      <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Confirmar contraseña"
                      value={managerData.confirmPassword}
                      onChange={(e) =>
                        handleManagerChange("confirmPassword", e.target.value)
                      }
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Dirección */}
            <div className="mb-4">
              <h6 className="mb-3 fw-bold text-primary">
                Dirección del Almacén
              </h6>
              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Calle <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Nombre de la calle"
                      value={address.street}
                      onChange={(e) =>
                        handleAddressChange("street", e.target.value)
                      }
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Núm. Ext. <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="123"
                      value={address.externalNumber}
                      onChange={(e) =>
                        handleAddressChange("externalNumber", e.target.value)
                      }
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Núm. Int.</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="A"
                      value={address.internalNumber}
                      onChange={(e) =>
                        handleAddressChange("internalNumber", e.target.value)
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Colonia <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Colonia"
                      value={address.neighborhood}
                      onChange={(e) =>
                        handleAddressChange("neighborhood", e.target.value)
                      }
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Ciudad <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ciudad"
                      value={address.city}
                      onChange={(e) =>
                        handleAddressChange("city", e.target.value)
                      }
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Estado <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Estado"
                      value={address.state}
                      onChange={(e) =>
                        handleAddressChange("state", e.target.value)
                      }
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Código Postal <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="00000"
                      value={address.postalCode}
                      onChange={(e) =>
                        handleAddressChange("postalCode", e.target.value)
                      }
                      maxLength={5}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Productos Iniciales */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0 fw-bold text-primary">
                  Productos Iniciales (Opcional)
                </h6>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={handleAddProduct}
                  className="d-flex align-items-center gap-1"
                  type="button"
                >
                  <Plus size={16} />
                  Agregar Producto
                </Button>
              </div>

              {productEntries.map((entry, index) => (
                <Row key={index} className="mb-2">
                  <Col md={7}>
                    <Form.Select
                      value={entry.productId}
                      onChange={(e) =>
                        handleProductChange(index, "productId", e.target.value)
                      }
                    >
                      <option value="">Seleccionar producto...</option>
                      {products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.nombre}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={3}>
                    <Form.Control
                      type="number"
                      min="0"
                      value={entry.quantity}
                      onChange={(e) =>
                        handleProductChange(index, "quantity", e.target.value)
                      }
                      placeholder="Cantidad"
                    />
                  </Col>
                  <Col md={2}>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleRemoveProduct(index)}
                      className="w-100"
                      type="button"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </Col>
                </Row>
              ))}
            </div>
          </Form>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0">
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={loading || loadingData}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Creando...
            </>
          ) : (
            "Crear Almacén"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateStorageModal;
