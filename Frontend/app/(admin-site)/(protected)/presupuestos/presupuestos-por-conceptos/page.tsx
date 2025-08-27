"use client";

import ExpenseConceptBudgetPage from "@/features/admin/modules/expenseConceptBudget/ExpenseConceptBudgetPage";
import { Container } from "react-bootstrap";

const ExpenseConceptBudgetRoutePage = () => {
  return (
    <Container fluid className="p-4">
      <ExpenseConceptBudgetPage />
    </Container>
  );
};

export default ExpenseConceptBudgetRoutePage;
