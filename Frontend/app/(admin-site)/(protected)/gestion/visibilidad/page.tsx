"use client";

import UserVisibility from "@/features/admin/modules/userVisibility/UserVisibility";
import { Container } from "react-bootstrap";

const VisibilityPage = () => {
  return (
    <Container fluid className="p-4">
      <UserVisibility />
    </Container>
  );
};

export default VisibilityPage;
