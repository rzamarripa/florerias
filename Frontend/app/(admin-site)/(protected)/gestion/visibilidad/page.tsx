'use client';

import React from 'react';
import { Container } from 'react-bootstrap';
import UserVisibilitySelector from '@/features/admin/modules/roles/components/UserVisibilitySelector';

const VisibilityPage = () => {
  return (
    <Container fluid className="p-4">
      <UserVisibilitySelector />
    </Container>
  );
};

export default VisibilityPage; 