"use client";

import Budget from "@/features/admin/modules/budget/Budget";
import { Container } from "react-bootstrap";

const BudgetPage = () => {
  return (
    <Container fluid className="p-4">
      <Budget />
    </Container>
  );
};

export default BudgetPage;
