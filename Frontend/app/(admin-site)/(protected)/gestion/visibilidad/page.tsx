'use client';

import React from 'react';
import { Card, Container } from 'react-bootstrap';
import { roleService } from '@/features/admin/modules/roles/services/roleService';
import RoleVisibilityTree from '@/features/admin/modules/roles/components/RoleVisibilityTree';
import { useEffect, useState } from 'react';

const VisibilityPage = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await roleService.getAll();
      if (response.success) {
        setRoles(response.data);
        if (response.data.length > 0) {
          setSelectedRole(response.data[0]._id);
        }
      }
    } catch (error) {
      console.error('Error al cargar roles:', error);
    }
  };

  return (
    <Container fluid className="p-4">
      <Card>
        <Card.Header>
          <h4 className="mb-0">Gestión de Visibilidad</h4>
        </Card.Header>
        <Card.Body>
          <div className="mb-3">
            <label className="form-label">Seleccionar Rol</label>
            <select 
              className="form-select" 
              value={selectedRole} 
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              {roles.map((role) => (
                <option key={role._id} value={role._id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          {selectedRole && (
            <RoleVisibilityTree roleId={selectedRole} />
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default VisibilityPage; 