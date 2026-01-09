import { Form, Accordion } from "react-bootstrap";
import { TbChevronDown, TbCategory } from "react-icons/tb";
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
    <div className="category-filter mb-4">
      <div className="d-flex align-items-center mb-3">
        <TbCategory size={18} className="me-2 text-muted" />
        <h6 className="mb-0">Categorías</h6>
      </div>
      
      <div className="category-list">
        {categories.length === 0 ? (
          <p className="text-muted small">No hay categorías disponibles</p>
        ) : (
          <div className="d-flex flex-column gap-2">
            {categories.map((category) => (
              <Form.Check
                key={category._id}
                type="checkbox"
                id={`category-${category._id}`}
                className="category-item"
              >
                <Form.Check.Input
                  type="checkbox"
                  checked={selectedCategories.includes(category._id)}
                  onChange={() => onCategoryToggle(category._id)}
                />
                <Form.Check.Label className="d-flex justify-content-between align-items-center w-100">
                  <span className="text-truncate me-2">{category.name}</span>
                  <span className="badge bg-light text-muted">
                    {getCategoryCount(category._id)}
                  </span>
                </Form.Check.Label>
              </Form.Check>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .category-filter {
          border-bottom: 1px solid #e9ecef;
          padding-bottom: 1rem;
        }
        .category-list {
          max-height: 300px;
          overflow-y: auto;
        }
        .category-list::-webkit-scrollbar {
          width: 4px;
        }
        .category-list::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .category-list::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 2px;
        }
        .category-item {
          padding: 0.25rem 0;
        }
        .category-item:hover {
          background-color: #f8f9fa;
          padding-left: 0.5rem;
          transition: all 0.2s;
        }
        .form-check-label {
          cursor: pointer;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};

export default CategoryFilter;