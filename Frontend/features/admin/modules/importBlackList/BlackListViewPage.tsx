"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";

import { blackListProvidersService } from "./services/blackListProviders";
import { BlackListProvider, Pagination, SummaryData } from "./types";
import SummaryCards from "./components/SummaryCards";
import BlackListViewTable from "./components/BlackListViewTable";
import BlackListFilters from "./components/BlackListFilters";

const BlackListViewPage: React.FC = () => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [providers, setProviders] = useState<BlackListProvider[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    rfc: "",
    nombre: "",
    situacion: "",
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(false);

  const fetchData = useCallback(async (page: number = 1, searchFilters: typeof filters) => {
    setLoadingSummary(true);
    setLoadingProviders(true);

    try {
      // Prepare search parameters
      const searchParams: any = {
        page,
        limit: 15,
        sortBy: "createdAt",
        order: "desc",
      };

      // Add filters if they have values
      if (searchFilters.rfc.trim()) {
        searchParams.rfc = searchFilters.rfc.trim();
      }
      if (searchFilters.nombre.trim()) {
        searchParams.nombre = searchFilters.nombre.trim();
      }
      if (searchFilters.situacion) {
        searchParams.situacion = searchFilters.situacion;
      }

      const [summaryRes, providersRes] = await Promise.all([
        blackListProvidersService.getSummary(),
        blackListProvidersService.getProviders(searchParams)
      ]);

      if (summaryRes.success) {
        setSummary(summaryRes.data);
      } else {
        toast.error("Error al cargar el resumen.");
        setSummary(null);
      }

      if (providersRes.success) {
        setProviders(providersRes.data);
        setPagination(providersRes.pagination || null);
      } else {
        toast.error("Error al cargar los proveedores.");
        setProviders([]);
        setPagination(null);
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Ocurrió un error al obtener los datos.");
    } finally {
      setLoadingSummary(false);
      setLoadingProviders(false);
    }
  }, []);

  useEffect(() => {
    fetchData(1, filters);
    
    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchData(page, filters);
  };

  // Use useRef to store the timeout ID
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleFilterChange = (field: string, value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    setCurrentPage(1);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      fetchData(1, newFilters);
    }, 500);
  };

  const handleClearFilters = () => {
    const clearedFilters = { rfc: "", nombre: "", situacion: "" };
    setFilters(clearedFilters);
    setCurrentPage(1);
    fetchData(1, clearedFilters);
  };

  return (
    <div className="container-fluid">
      <div className="mb-4">
        <SummaryCards summary={summary} loading={loadingSummary} />
      </div>

      <BlackListFilters
        rfc={filters.rfc}
        nombre={filters.nombre}
        situacion={filters.situacion}
        onRfcChange={(value) => handleFilterChange("rfc", value)}
        onNombreChange={(value) => handleFilterChange("nombre", value)}
        onSituacionChange={(value) => handleFilterChange("situacion", value)}
        onClearFilters={handleClearFilters}
      />

      <BlackListViewTable
        providers={providers}
        pagination={pagination}
        loading={loadingProviders}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default BlackListViewPage;