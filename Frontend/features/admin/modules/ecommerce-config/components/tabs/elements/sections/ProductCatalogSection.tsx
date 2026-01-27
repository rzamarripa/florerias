import React from 'react';
import { ShoppingBag, LayoutGrid, LayoutList, Filter } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface ProductCatalogSectionProps {
  catalogEnabled: boolean;
  setCatalogEnabled: (value: boolean) => void;
  catalogDisplay: string;
  setCatalogDisplay: (value: string) => void;
  catalogProductsPerPage: number;
  setCatalogProductsPerPage: (value: number) => void;
  catalogShowFilters: boolean;
  setCatalogShowFilters: (value: boolean) => void;
  catalogShowCategories: boolean;
  setCatalogShowCategories: (value: boolean) => void;
  catalogShowSearch: boolean;
  setCatalogShowSearch: (value: boolean) => void;
  catalogShowSort: boolean;
  setCatalogShowSort: (value: boolean) => void;
}

const ProductCatalogSection: React.FC<ProductCatalogSectionProps> = ({
  catalogEnabled,
  setCatalogEnabled,
  catalogDisplay,
  setCatalogDisplay,
  catalogProductsPerPage,
  setCatalogProductsPerPage,
  catalogShowFilters,
  setCatalogShowFilters,
  catalogShowCategories,
  setCatalogShowCategories,
  catalogShowSearch,
  setCatalogShowSearch,
  catalogShowSort,
  setCatalogShowSort,
}) => {
  return (
    <AccordionItem value="catalog" className="border rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50">
        <AccordionTrigger className="flex-1 hover:no-underline py-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-purple-500" />
            <span className="font-semibold">Catalogo de Productos</span>
          </div>
        </AccordionTrigger>
        <Switch
          id="catalog-switch"
          checked={catalogEnabled}
          onCheckedChange={setCatalogEnabled}
        />
      </div>
      <AccordionContent className="px-4 pb-4 pt-2 bg-background">
        {catalogEnabled ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Tipo de visualizacion
                </Label>
                <Select
                  value={catalogDisplay}
                  onValueChange={setCatalogDisplay}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Cuadricula</SelectItem>
                    <SelectItem value="list">Lista</SelectItem>
                    <SelectItem value="cards">Tarjetas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Productos por pagina</Label>
                <Select
                  value={String(catalogProductsPerPage)}
                  onValueChange={(value) => setCatalogProductsPerPage(Number(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 productos</SelectItem>
                    <SelectItem value="9">9 productos</SelectItem>
                    <SelectItem value="12">12 productos</SelectItem>
                    <SelectItem value="15">15 productos</SelectItem>
                    <SelectItem value="20">20 productos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" />
                Opciones de navegacion
              </Label>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        id="show-filters"
                        checked={catalogShowFilters}
                        onCheckedChange={setCatalogShowFilters}
                      />
                      <Label htmlFor="show-filters" className="cursor-pointer text-sm">
                        Mostrar filtros laterales
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        id="show-categories"
                        checked={catalogShowCategories}
                        onCheckedChange={setCatalogShowCategories}
                      />
                      <Label htmlFor="show-categories" className="cursor-pointer text-sm">
                        Mostrar categorias
                      </Label>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        id="show-search"
                        checked={catalogShowSearch}
                        onCheckedChange={setCatalogShowSearch}
                      />
                      <Label htmlFor="show-search" className="cursor-pointer text-sm">
                        Mostrar barra de busqueda
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        id="show-sort"
                        checked={catalogShowSort}
                        onCheckedChange={setCatalogShowSort}
                      />
                      <Label htmlFor="show-sort" className="cursor-pointer text-sm">
                        Mostrar opciones de ordenamiento
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-3 bg-background">
              <h6 className="font-medium mb-2">Vista previa del diseno</h6>
              <div className="flex items-center text-sm text-muted-foreground">
                {catalogDisplay === 'grid' && <LayoutGrid className="h-4 w-4 mr-2" />}
                {catalogDisplay === 'list' && <LayoutList className="h-4 w-4 mr-2" />}
                {catalogDisplay === 'cards' && <LayoutGrid className="h-4 w-4 mr-2" />}
                <span>
                  {catalogDisplay === 'grid' && 'Los productos se mostraran en una cuadricula de 3-4 columnas'}
                  {catalogDisplay === 'list' && 'Los productos se mostraran en una lista vertical con detalles'}
                  {catalogDisplay === 'cards' && 'Los productos se mostraran como tarjetas grandes con informacion completa'}
                </span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              El catalogo mostrara todos los productos activos con stock disponible
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-3">Catalogo de productos deshabilitado</p>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};

export default ProductCatalogSection;
