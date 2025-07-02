import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { userVisibilityService } from "../services/userVisibility";
import { TreeNode, VisibilityStructure } from "../types";

const extractIds = (selectedNodeIds: string[]) => {
  const companies = new Set<string>();
  const brands = new Set<string>();
  const brandsFull: { companyId: string; brandId: string }[] = [];
  const branchesFull: {
    companyId: string;
    brandId: string;
    branchId: string;
  }[] = [];

  selectedNodeIds.forEach((id) => {
    if (id.startsWith("company_")) {
      companies.add(id.replace("company_", ""));
    } else if (id.startsWith("brand_")) {
      const parts = id.split("_");
      if (parts.length === 3) {
        brands.add(parts[2]);
        brandsFull.push({ companyId: parts[1], brandId: parts[2] });
      }
    } else if (id.startsWith("branch_")) {
      const parts = id.split("_");
      if (parts.length === 4) {
        branchesFull.push({
          companyId: parts[1],
          brandId: parts[2],
          branchId: parts[3],
        });
      }
    }
  });

  return {
    companies: Array.from(companies),
    brands: brandsFull,
    branches: branchesFull,
  };
};

export const useUserVisibility = (userId: string) => {
  const [loading, setLoading] = useState(true);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [selectedItems, setSelectedItems] = useState<{
    companies: string[];
    brands: any[];
    branches: any[];
  }>({ companies: [], brands: [], branches: [] });

  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentUserIdRef = useRef<string>("");

  const loadVisibilityStructure = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setTreeData([]);
      setSelectedItems({ companies: [], brands: [], branches: [] });

      const structureResponse = await userVisibilityService.getAllStructure();
      const selectedResponse = await userVisibilityService.getStructure(userId);

      if (structureResponse.success && selectedResponse.success) {
        const structure = structureResponse.data;
        const selected = selectedResponse.data as VisibilityStructure;

        let selectedBrandsFull: any[] = [];
        let selectedBranchesFull: any[] = [];
        if (
          selected.brands &&
          Array.isArray(selected.brands) &&
          selected.brands.length > 0 &&
          typeof selected.brands[0] === "object"
        ) {
          selectedBrandsFull = selected.brands;
        }
        if (
          selected.branches &&
          Array.isArray(selected.branches) &&
          selected.branches.length > 0 &&
          typeof selected.branches[0] === "object"
        ) {
          selectedBranchesFull = selected.branches;
        }

        const nodes: TreeNode[] = [
          {
            id: "root",
            text: "Visibilidad",
            parent: "#",
            state: { opened: true },
          },
        ];

        if (structure?.companies) {
          Object.entries(structure.companies).forEach(
            ([companyId, companyData]: [string, any]) => {
              const companyNodeId = `company_${companyId}`;
              nodes.push({
                id: companyNodeId,
                text: companyData.name || "Compañía sin nombre",
                parent: "root",
                type: "company",
                state: {
                  opened: true,
                  selected:
                    selected.selectedCompanies?.includes(companyId) || false,
                },
              });

              if (companyData.brands) {
                Object.entries(companyData.brands).forEach(
                  ([brandId, brandData]: [string, any]) => {
                    const brandNodeId = `brand_${companyId}_${brandId}`;
                    const isBrandSelected = selectedBrandsFull.some(
                      (b: any) =>
                        String(b.companyId) === String(companyId) &&
                        String(b.brandId) === String(brandId)
                    );
                    nodes.push({
                      id: brandNodeId,
                      text: brandData.name || "Marca sin nombre",
                      parent: companyNodeId,
                      type: "brand",
                      state: {
                        opened: true,
                        selected: isBrandSelected,
                      },
                    });

                    if (brandData.branches) {
                      Object.entries(brandData.branches).forEach(
                        ([branchId, branchData]: [string, any]) => {
                          const isBranchSelected = selectedBranchesFull.some(
                            (b: any) =>
                              String(b.companyId) === String(companyId) &&
                              String(b.brandId) === String(brandId) &&
                              String(b.branchId) === String(branchId)
                          );
                          nodes.push({
                            id: `branch_${companyId}_${brandId}_${branchId}`,
                            text: branchData.name || "Sucursal sin nombre",
                            parent: brandNodeId,
                            type: "branch",
                            state: {
                              selected: isBranchSelected,
                            },
                          });
                        }
                      );
                    }
                  }
                );
              }
            }
          );
        }

        setTreeData(nodes);
        setSelectedItems({
          companies: selected.selectedCompanies || [],
          brands: selectedBrandsFull,
          branches: selectedBranchesFull,
        });
      } else {
        toast.error(
          "Error al cargar la estructura: " +
            (structureResponse.message ||
              selectedResponse.message ||
              "Respuesta inválida")
        );
      }
    } catch (err: any) {
      console.error("Error al cargar la estructura:", err);
      toast.error(err.message || "Error al cargar la estructura");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateVisibility = useCallback(
    async (data: { companies: string[]; brands: any[]; branches: any[] }) => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = setTimeout(async () => {
        const userIdToUpdate = currentUserIdRef.current;

        if (userIdToUpdate !== userId) {
          return;
        }

        try {
          const response = await userVisibilityService.update(userId, data);
          if (response.success) {
            toast.success("Visibilidad actualizada correctamente");
            setSelectedItems(data);
          } else {
            toast.error(
              response.message || "Error al actualizar la visibilidad"
            );
          }
        } catch (err: any) {
          console.error("Error al actualizar la visibilidad:", err);
          toast.error(err.message || "Error al actualizar la visibilidad");
          loadVisibilityStructure();
        }
      }, 500);
    },
    [userId, loadVisibilityStructure]
  );

  const handleSelectionChange = useCallback(
    (selectedNodes: string[]) => {
      const { companies, brands, branches } = extractIds(selectedNodes);
      updateVisibility({ companies, brands, branches });
    },
    [updateVisibility]
  );

  useEffect(() => {
    if (userId !== currentUserIdRef.current) {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
      currentUserIdRef.current = userId;
      loadVisibilityStructure();
    }
  }, [userId, loadVisibilityStructure]);

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
    };
  }, []);

  return {
    loading,
    treeData,
    selectedItems,
    handleSelectionChange,
    loadVisibilityStructure,
  };
};
