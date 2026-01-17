import { LayoutGrid } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import type { ProductCategory } from "@/features/admin/modules/productCategories/types";

interface CategoryFilterProps {
  categories: ProductCategory[];
  selectedCategories: string[];
  onCategoryToggle: (categoryId: string) => void;
  productCounts?: Record<string, number>;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategories,
  onCategoryToggle,
  productCounts
}) => {
  const getCategoryCount = (categoryId: string) => {
    return productCounts?.[categoryId] || 0;
  };

  return (
    <div className="border-b pb-4 mb-4">
      <div className="flex items-center mb-3">
        <LayoutGrid className="h-4 w-4 mr-2 text-muted-foreground" />
        <h6 className="text-sm font-medium mb-0">Categorias</h6>
      </div>

      <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {categories.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay categorias disponibles</p>
        ) : (
          <div className="flex flex-col gap-2">
            {categories.map((category) => (
              <div
                key={category._id}
                className="flex items-center space-x-2 py-1 px-1 hover:bg-muted/50 rounded transition-colors cursor-pointer"
                onClick={() => onCategoryToggle(category._id)}
              >
                <Checkbox
                  id={`category-${category._id}`}
                  checked={selectedCategories.includes(category._id)}
                  onCheckedChange={() => onCategoryToggle(category._id)}
                />
                <Label
                  htmlFor={`category-${category._id}`}
                  className="flex-1 flex justify-between items-center cursor-pointer text-sm"
                >
                  <span className="truncate mr-2">{category.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {getCategoryCount(category._id)}
                  </Badge>
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryFilter;
