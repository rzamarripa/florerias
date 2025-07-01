'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Card } from 'react-bootstrap';
import { userVisibilityService } from '../services/roleVisibility';
import { useUserSessionStore } from '@/stores/userSessionStore';
import 'jstree/dist/themes/default/style.min.css';
import jQuery from 'jquery';
import 'jstree';
import { toast } from 'react-toastify';
import { TbBuildingSkyscraper, TbBuildingStore, TbUsers } from 'react-icons/tb';

// Declaraciones de tipos para jsTree
declare global {
  interface JQuery {
    jstree(command?: string | any, ...args: any[]): any;
  }
}

// Asignar jQuery globalmente para jsTree
if (typeof window !== 'undefined') {
  (window as any).$ = (window as any).jQuery = jQuery;
}

interface VisibilityStructure {
  companies: Record<string, any>;
  selectedCompanies: string[];
  selectedBrands: string[];
  selectedBranches: string[];
}

interface JsTreeData {
  node?: any;
  selected: string[];
  action: string;
  selected_node?: any;
}

interface JsTreeEvent extends JQuery.Event {
  namespace: string;
}

interface TreeNode {
  id: string;
  text: string;
  parent: string;
  type?: string;
  state?: {
    opened?: boolean;
    selected?: boolean;
  };
}

interface UserVisibilityTreeProps {
  userId: string;
}

interface JsTreeNode {
  type?: string;
  id: string;
}

const UserVisibilityTree: React.FC<UserVisibilityTreeProps> = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<{
    companies: string[];
    brands: string[];
    branches: string[];
  }>({ companies: [], brands: [], branches: [] });
  const token = useUserSessionStore(state => state.token);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No hay sesión activa. Por favor, inicia sesión nuevamente.');
      return;
    }
    loadVisibilityStructure();
  }, [userId, token]);

  const loadVisibilityStructure = async () => {
    try {
      setLoading(true);
      setError('');

      // Primero obtenemos la estructura completa
      const structureResponse = await userVisibilityService.getAllStructure();
      // Luego obtenemos las selecciones del usuario
      const selectedResponse = await userVisibilityService.getStructure(userId);

      if (structureResponse.success && selectedResponse.success) {
        const structure = structureResponse.data;
        const selected = selectedResponse.data as VisibilityStructure;

        const nodes: TreeNode[] = [
          {
            id: 'root',
            text: 'Visibilidad',
            parent: '#',
            state: { opened: true }
          }
        ];

        // Guardar los nodos seleccionados
        setSelectedNodes({
          companies: selected.selectedCompanies || [],
          brands: selected.selectedBrands || [],
          branches: selected.selectedBranches || []
        });

        // Convertir la estructura jerárquica a formato de árbol
        if (structure?.companies) {
          Object.entries(structure.companies).forEach(([companyId, companyData]: [string, any]) => {
            const companyNodeId = `company_${companyId}`;
            // Agregar compañía
            nodes.push({
              id: companyNodeId,
              text: companyData.name || 'Compañía sin nombre',
              parent: 'root',
              type: 'company',
              state: {
                opened: true,
                selected: selected.selectedCompanies?.includes(companyId) || false
              }
            });

            // Agregar marcas de la compañía
            if (companyData.brands) {
              Object.entries(companyData.brands).forEach(([brandId, brandData]: [string, any]) => {
                const brandNodeId = `brand_${companyId}_${brandId}`;
                nodes.push({
                  id: brandNodeId,
                  text: brandData.name || 'Marca sin nombre',
                  parent: companyNodeId,
                  type: 'brand',
                  state: {
                    opened: true,
                    selected: selected.selectedBrands?.includes(brandId) || false
                  }
                });

                // Agregar sucursales de la marca
                if (brandData.branches) {
                  Object.entries(brandData.branches).forEach(([branchId, branchData]: [string, any]) => {
                    nodes.push({
                      id: `branch_${companyId}_${brandId}_${branchId}`,
                      text: branchData.name || 'Sucursal sin nombre',
                      parent: brandNodeId,
                      type: 'branch',
                      state: {
                        selected: selected.selectedBranches?.includes(branchId) || false
                      }
                    });
                  });
                }
              });
            }
          });
        }

        console.log('Nodos generados:', nodes);
        setTreeData(nodes);
      } else {
        console.error('Error en la respuesta:', structureResponse, selectedResponse);
        setError('Error al cargar la estructura: ' + (structureResponse.message || selectedResponse.message || 'Respuesta inválida'));
      }
    } catch (err: any) {
      console.error('Error al cargar la estructura:', err);
      setError(err.message || 'Error al cargar la estructura');
    } finally {
      setLoading(false);
    }
  };

  const debouncedUpdate = useCallback((data: { companies: string[], brands: string[], branches: string[] }) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await userVisibilityService.update(userId, data);
        if (response.success) {
          toast.success('Visibilidad actualizada correctamente');
        } else {
          toast.error(response.message || 'Error al actualizar la visibilidad');
        }
      } catch (err: any) {
        console.error('Error al actualizar la visibilidad:', err);
        toast.error(err.message || 'Error al actualizar la visibilidad');
        // Recargar la estructura en caso de error
        loadVisibilityStructure();
      }
    }, 500); // Esperar 500ms entre actualizaciones
  }, [userId]);

  useEffect(() => {
    if (!loading && treeData.length > 0 && typeof window !== 'undefined') {
      const $tree = jQuery('#visibility-tree');

      // Destruir instancia anterior si existe
      if ($tree.jstree(true)) {
        $tree.jstree('destroy');
      }

      // Inicializar JSTree con la nueva configuración
      $tree.jstree({
        core: {
          data: treeData,
          themes: {
            name: 'default',
            dots: true,
            icons: true,
            responsive: true,
            stripes: true
          },
          check_callback: true,
          multiple: true
        },
        checkbox: {
          keep_selected_style: true,
          three_state: true,
          cascade: 'up+undetermined',
          tie_selection: true,
          whole_node: false
        },
        types: {
          default: {
            icon: false
          },
          company: {
            icon: 'jstree-icon jstree-themeicon company-icon jstree-themeicon-custom'
          },
          brand: {
            icon: 'jstree-icon jstree-themeicon brand-icon jstree-themeicon-custom'
          },
          branch: {
            icon: 'jstree-icon jstree-themeicon branch-icon jstree-themeicon-custom'
          }
        },
        plugins: ['checkbox', 'types', 'wholerow', 'changed', 'state']
      });

      $tree.on('ready.jstree', function () {
        $tree.jstree('open_all');
      });

      // Manejar cambios en la selección
      $tree.on('changed.jstree', function (e: any, data: JsTreeData) {
        if (!data.node) return;

        const selectedNodes = data.selected;
        const companies: string[] = [];
        const brands: string[] = [];
        const branches: string[] = [];

        selectedNodes.forEach((nodeId: string) => {
          if (nodeId.startsWith('company_')) {
            companies.push(nodeId.replace('company_', ''));
          } else if (nodeId.startsWith('brand_')) {
            // Extraer solo el ID de la marca del identificador compuesto
            const [_, companyId, brandId] = nodeId.split('_');
            if (brandId) {
              brands.push(brandId);
            }
          } else if (nodeId.startsWith('branch_')) {
            // Extraer solo el ID de la sucursal del identificador compuesto
            const [_, companyId, brandId, branchId] = nodeId.split('_');
            if (branchId) {
              branches.push(branchId);
            }
          }
        });

        debouncedUpdate({ companies, brands, branches });
      });
    }

    return () => {
      const $tree = jQuery('#visibility-tree');
      if ($tree.jstree(true)) {
        $tree.jstree('destroy');
      }
      // Limpiar timeout pendiente
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [loading, treeData, userId, token, debouncedUpdate]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        {error}
        <button
          className="btn btn-link"
          onClick={() => {
            setError('');
            loadVisibilityStructure();
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <Card>
      <Card.Header>
        <h4 className="card-title">Visibilidad del Usuario</h4>
        <p className="text-muted mb-0">
          Selecciona las razones sociales, marcas y sucursales a las que este usuario tendrá acceso.
          Si no seleccionas ninguna, el usuario tendrá acceso total.
        </p>
      </Card.Header>
      <Card.Body>
        <div id="visibility-tree" style={{ minHeight: '300px' }}></div>
        <style jsx>{`
          :global(.jstree-default .jstree-themeicon) {
            background: none !important;
          }
          :global(.jstree-themeicon-custom.company-icon::before) {
            content: "" !important;
            display: inline-block;
            width: 24px;
            height: 24px;
            background-image: url('data:image/svg+xml,${encodeURIComponent(`<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M17 21.5L17 3.5C17 2.67157 16.3284 2 15.5 2L8.5 2C7.67157 2 7 2.67157 7 3.5L7 21.5M17 21.5L22 21.5M17 21.5L7 21.5M7 21.5L2 21.5M17 16.5L22 16.5M2 16.5L7 16.5M2.5 21.5L2.5 16.5M21.5 21.5L21.5 16.5M4.5 7L4.5 8.5M4.5 10.5L4.5 12M4.5 14L4.5 15.5M19.5 7L19.5 8.5M19.5 10.5L19.5 12M19.5 14L19.5 15.5M9 6L10.5 6M12.5 6L14 6M9 9.5L10.5 9.5M12.5 9.5L14 9.5M9 13L10.5 13M12.5 13L14 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`)}');
            background-repeat: no-repeat;
            background-position: center;
            vertical-align: middle;
            opacity: 0.7;
          }
          :global(.jstree-themeicon-custom.brand-icon::before) {
            content: "" !important;
            display: inline-block;
            width: 24px;
            height: 24px;
            background-image: url('data:image/svg+xml,${encodeURIComponent(`<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M22 8.5C22 10.433 20.433 12 18.5 12C16.567 12 15 10.433 15 8.5C15 6.567 16.567 5 18.5 5C20.433 5 22 6.567 22 8.5Z M22 22H2V19C2 15.134 5.134 12 9 12C12.866 12 16 15.134 16 19V22Z M13.5 5.5C13.5 7.98528 11.4853 10 9 10C6.51472 10 4.5 7.98528 4.5 5.5C4.5 3.01472 6.51472 1 9 1C11.4853 1 13.5 3.01472 13.5 5.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`)}');
            background-repeat: no-repeat;
            background-position: center;
            vertical-align: middle;
            opacity: 0.7;
          }
          :global(.jstree-themeicon-custom.branch-icon::before) {
            content: "" !important;
            display: inline-block;
            width: 24px;
            height: 24px;
            background-image: url('data:image/svg+xml,${encodeURIComponent(`<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M19 21V15H19.5L21.2071 16.7071C21.5976 17.0976 21.5976 17.7308 21.2071 18.1213L19.5 19.8284V20.5C19.5 20.7761 19.2761 21 19 21Z M2 21V3C2 2.44772 2.44772 2 3 2H17C17.5523 2 18 2.44772 18 3V21M2 21H18M2 21H1M18 21H19M2 17H18M2 12H18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`)}');
            background-repeat: no-repeat;
            background-position: center;
            vertical-align: middle;
            opacity: 0.7;
          }
          :global(.jstree-default .jstree-clicked) {
            background: transparent !important;
            border-radius: 4px;
            box-shadow: none !important;
            font-weight: 500;
            color: #435971;
          }
          :global(.jstree-default .jstree-hovered) {
            background: #f5f5f5 !important;
            border-radius: 4px;
            box-shadow: none !important;
          }
          :global(.jstree-default .jstree-wholerow-clicked) {
            background: transparent !important;
          }
          :global(.jstree-default .jstree-wholerow-hovered) {
            background: #f5f5f5 !important;
          }
          :global(.jstree-node) {
            margin-left: 12px !important;
          }
          :global(.jstree-container-ul) {
            margin: 12px !important;
          }
          :global(.jstree-default .jstree-anchor) {
            line-height: 28px !important;
            height: 28px !important;
          }
          :global(.jstree-default .jstree-icon) {
            line-height: 28px !important;
            height: 28px !important;
            color: #697a8d;
          }
          :global(.jstree-default .jstree-node) {
            min-height: 28px !important;
            line-height: 28px !important;
            margin-left: 20px !important;
            min-width: 28px !important;
          }
          :global(.jstree-default .jstree-wholerow) {
            height: 28px !important;
          }
          :global(.jstree-default .jstree-icon:empty) {
            width: 28px !important;
            height: 28px !important;
            line-height: 28px !important;
          }
          :global(.jstree-default > .jstree-container-ul > .jstree-node) {
            margin-left: 0 !important;
          }
          :global(.jstree-default .jstree-ocl) {
            width: 28px !important;
            height: 28px !important;
            line-height: 28px !important;
            background-position: -132px -4px !important;
          }
          :global(.jstree-default .jstree-open > .jstree-ocl) {
            background-position: -100px -4px !important;
          }
          :global(.jstree-default .jstree-leaf > .jstree-ocl) {
            background-position: -68px -4px !important;
          }
          :global(.jstree-default .jstree-last) {
            background: transparent !important;
          }
          :global(.jstree-children) {
            margin-left: 0 !important;
          }
          :global(.jstree-default .jstree-themeicon-custom) {
            background-color: transparent !important;
            border-radius: 0 !important;
          }
        `}</style>
      </Card.Body>
    </Card>
  );
};

export default UserVisibilityTree; 