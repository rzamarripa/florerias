"use client";

import React, { useEffect, useState } from "react";
import { Alert, Button, Card, Col, Form, Row } from "react-bootstrap";
import { toast } from "react-toastify";
import {
  Branch,
  Brand,
  budgetService,
  Category,
  Company,
  Route,
} from "./services/budgetService";

const Budget: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");

  const [budgetAmount, setBudgetAmount] = useState<number>(0);
  const [currentBudget, setCurrentBudget] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const currentDate = new Date();
    const currentMonth = (currentDate.getMonth() + 1)
      .toString()
      .padStart(2, "0");
    const currentYear = currentDate.getFullYear().toString();
    setSelectedMonth(currentMonth);
    setSelectedYear(currentYear);
    loadCategories();
  }, []);

  // Cargar datos en cascada
  useEffect(() => {
    if (selectedCategory) {
      loadCompanies();
      resetSelections(["company", "brand", "branch", "route"]);
    }
  }, [selectedCategory, categories]);

  useEffect(() => {
    if (selectedCategory && selectedCompany) {
      loadBrands();
      resetSelections(["brand", "branch", "route"]);
    }
  }, [selectedCategory, selectedCompany]);

  useEffect(() => {
    if (selectedCompany && selectedBrand) {
      loadBranches();
      resetSelections(["branch", "route"]);
    }
  }, [selectedCompany, selectedBrand]);

  useEffect(() => {
    const selectedCategoryData = categories.find(
      (c) => c._id === selectedCategory
    );
    if (
      selectedCategoryData?.hasRoutes &&
      selectedCompany &&
      selectedBrand &&
      selectedBranch
    ) {
      loadRoutes();
      resetSelections(["route"]);
    }
  }, [
    selectedCompany,
    selectedBrand,
    selectedBranch,
    categories,
    selectedCategory,
  ]);

  // Cargar presupuesto actual cuando todos los datos necesarios están disponibles
  useEffect(() => {
    if (canLoadBudget()) {
      loadCurrentBudget();
    }
  }, [
    selectedCategory,
    selectedCompany,
    selectedBrand,
    selectedBranch,
    selectedRoute,
    selectedMonth,
    selectedYear,
  ]);

  const resetSelections = (selections: string[]) => {
    if (selections.includes("company")) {
      setSelectedCompany("");
      setCompanies([]);
    }
    if (selections.includes("brand")) {
      setSelectedBrand("");
      setBrands([]);
    }
    if (selections.includes("branch")) {
      setSelectedBranch("");
      setBranches([]);
    }
    if (selections.includes("route")) {
      setSelectedRoute("");
      setRoutes([]);
    }
    setBudgetAmount(0);
    setCurrentBudget(null);
  };

  const loadCategories = async () => {
    try {
      const response = await budgetService.getCategories();
      if (response.success) {
        setCategories(response.data || []);
      } else {
        toast.error(response.message || "Error al cargar unidades de negocio");
      }
    } catch {
      toast.error("Error al cargar unidades de negocio");
    }
  };

  const loadCompanies = async () => {
    if (!selectedCategory) return;

    try {
      setLoading(true);
      const response = await budgetService.getCompaniesByCategory(
        selectedCategory
      );
      if (response.success) {
        setCompanies(response.data || []);
      } else {
        toast.error(response.message || "Error al cargar razones sociales");
      }
    } catch {
      toast.error("Error al cargar razones sociales");
    } finally {
      setLoading(false);
    }
  };

  const loadBrands = async () => {
    if (!selectedCategory || !selectedCompany) return;

    try {
      setLoading(true);
      const response = await budgetService.getBrandsByCategoryAndCompany(
        selectedCategory,
        selectedCompany
      );
      if (response.success) {
        setBrands(response.data || []);
      } else {
        toast.error(response.message || "Error al cargar marcas");
      }
    } catch {
      toast.error("Error al cargar marcas");
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    if (!selectedCompany || !selectedBrand) return;

    try {
      setLoading(true);
      const response = await budgetService.getBranchesByCompanyAndBrand(
        selectedCompany,
        selectedBrand
      );
      if (response.success) {
        setBranches(response.data || []);
      } else {
        toast.error(response.message || "Error al cargar sucursales");
      }
    } catch {
      toast.error("Error al cargar sucursales");
    } finally {
      setLoading(false);
    }
  };

  const loadRoutes = async () => {
    if (!selectedCompany || !selectedBrand || !selectedBranch) return;

    try {
      setLoading(true);
      const response = await budgetService.getRoutesByCompanyBrandAndBranch(
        selectedCompany,
        selectedBrand,
        selectedBranch
      );
      if (response.success) {
        setRoutes(response.data || []);
      } else {
        toast.error(response.message || "Error al cargar rutas");
      }
    } catch {
      toast.error("Error al cargar rutas");
    } finally {
      setLoading(false);
    }
  };

  const canLoadBudget = () => {
    const selectedCategoryData = categories.find(
      (c) => c._id === selectedCategory
    );
    if (
      !selectedCategoryData ||
      !selectedCompany ||
      !selectedBrand ||
      !selectedBranch ||
      !selectedMonth ||
      !selectedYear
    ) {
      return false;
    }

    // Para categorías con rutas, necesitamos también la ruta seleccionada
    if (selectedCategoryData.hasRoutes) {
      return !!selectedRoute;
    }

    return true;
  };

  const loadCurrentBudget = async () => {
    if (!canLoadBudget()) return;

    try {
      const monthYear = `${selectedYear}-${selectedMonth}`;
      const selectedCategoryData = categories.find(
        (c) => c._id === selectedCategory
      );

      const filters: any = {
        companyId: selectedCompany,
        categoryId: selectedCategory,
        brandId: selectedBrand,
        branchId: selectedBranch,
      };

      if (selectedCategoryData?.hasRoutes) {
        filters.routeId = selectedRoute;
      }

      const response = await budgetService.getBudgetsByMonth(
        monthYear,
        filters
      );

      if (response.success && response.data && response.data.length > 0) {
        const budget = response.data[0];
        setCurrentBudget(budget);
        setBudgetAmount(budget.assignedAmount);
      } else {
        setCurrentBudget(null);
        setBudgetAmount(0);
      }
    } catch {
      setCurrentBudget(null);
      setBudgetAmount(0);
    }
  };

  const handleSaveBudget = async () => {
    if (!canLoadBudget()) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    if (budgetAmount <= 0) {
      toast.error("El monto del presupuesto debe ser mayor a 0");
      return;
    }

    setSaving(true);
    try {
      const monthYear = `${selectedYear}-${selectedMonth}`;
      const budgetData = {
        categoryId: selectedCategory,
        companyId: selectedCompany,
        branchId: selectedBranch,
        brandId: selectedBrand,
        routeId: selectedRoute || "",
        assignedAmount: budgetAmount,
        month: monthYear,
      };

      const response = await budgetService.createBudget(budgetData);

      if (response.success) {
        toast.success("Presupuesto guardado correctamente");
        loadCurrentBudget();
      } else {
        toast.error(response.message || "Error al guardar presupuesto");
      }
    } catch (error: any) {
      toast.error(
        "Error al guardar presupuesto: " +
          (error.message || "Error desconocido")
      );
    } finally {
      setSaving(false);
    }
  };

  const generateYearOptions = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 2; year <= currentYear + 3; year++) {
      years.push(year.toString());
    }
    return years;
  };

  const generateMonthOptions = () => {
    return [
      { value: "01", label: "Enero" },
      { value: "02", label: "Febrero" },
      { value: "03", label: "Marzo" },
      { value: "04", label: "Abril" },
      { value: "05", label: "Mayo" },
      { value: "06", label: "Junio" },
      { value: "07", label: "Julio" },
      { value: "08", label: "Agosto" },
      { value: "09", label: "Septiembre" },
      { value: "10", label: "Octubre" },
      { value: "11", label: "Noviembre" },
      { value: "12", label: "Diciembre" },
    ];
  };

  const selectedCategoryData = categories.find(
    (c) => c._id === selectedCategory
  );
  const monthYear =
    selectedMonth && selectedYear ? `${selectedYear}-${selectedMonth}` : "";

  return (
    <div>
      <Card className="mb-4">
        <Card.Header>
          <h4 className="card-title">Gestión de Presupuestos</h4>
          <p className="text-muted mb-0">
            Selecciona la información requerida para asignar presupuesto.
          </p>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Unidad de Negocio *</Form.Label>
                <Form.Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Selecciona una unidad de negocio...</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Año *</Form.Label>
                <Form.Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Selecciona un año...</option>
                  {generateYearOptions().map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Mes *</Form.Label>
                <Form.Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Selecciona un mes...</option>
                  {generateMonthOptions().map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {selectedCategory && (
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Razón Social *</Form.Label>
                  <Form.Select
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    disabled={loading || !selectedCategory}
                  >
                    <option value="">Selecciona una razón social...</option>
                    {companies.map((company) => (
                      <option key={company._id} value={company._id}>
                        {company.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Marca *</Form.Label>
                  <Form.Select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    disabled={loading || !selectedCompany}
                  >
                    <option value="">Selecciona una marca...</option>
                    {brands.map((brand) => (
                      <option key={brand._id} value={brand._id}>
                        {brand.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          )}

          {selectedBrand && (
            <Row>
              <Col md={selectedCategoryData?.hasRoutes ? 6 : 12}>
                <Form.Group className="mb-3">
                  <Form.Label>Sucursal *</Form.Label>
                  <Form.Select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    disabled={loading || !selectedBrand}
                  >
                    <option value="">Selecciona una sucursal...</option>
                    {branches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {selectedCategoryData?.hasRoutes && (
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Ruta *</Form.Label>
                    <Form.Select
                      value={selectedRoute}
                      onChange={(e) => setSelectedRoute(e.target.value)}
                      disabled={loading || !selectedBranch}
                    >
                      <option value="">Selecciona una ruta...</option>
                      {routes.map((route) => (
                        <option key={route._id} value={route._id}>
                          {route.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}
            </Row>
          )}
        </Card.Body>
      </Card>

      {canLoadBudget() && (
        <Card>
          <Card.Header>
            <h5 className="card-title">Asignación de Presupuesto</h5>
            <p className="text-muted mb-0">
              {selectedCategoryData?.name} - {monthYear}
              {selectedCategoryData?.hasRoutes
                ? " (Presupuesto asignado a ruta)"
                : " (Presupuesto asignado a sucursal)"}
            </p>
          </Card.Header>
          <Card.Body>
            {currentBudget && (
              <Alert variant="info" className="mb-3">
                <strong>Presupuesto actual:</strong> $
                {currentBudget.assignedAmount.toLocaleString()}
              </Alert>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Monto del Presupuesto *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={budgetAmount}
                    onChange={(e) =>
                      setBudgetAmount(parseFloat(e.target.value) || 0)
                    }
                    placeholder="0.00"
                  />
                </Form.Group>
              </Col>
              <Col md={6} className="d-flex align-items-end">
                <Button
                  variant="primary"
                  onClick={handleSaveBudget}
                  disabled={saving || budgetAmount <= 0}
                  className="mb-3"
                >
                  {saving ? "Guardando..." : "Guardar Presupuesto"}
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default Budget;
