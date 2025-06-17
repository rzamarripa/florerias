import React from "react";
import CategoriesTable from "../categories/components/CategoriesTable";

const CategoriesPage: React.FC = () => {
  return (
    <div className="container-fluid ">
      <div className="row">
          <CategoriesTable />
      </div>
    </div>
  );
};

export default CategoriesPage;