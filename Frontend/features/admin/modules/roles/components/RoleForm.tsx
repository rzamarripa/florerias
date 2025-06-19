'use client';

import React, { useEffect, useState } from 'react';
import { Button, Card, Form } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { roleSchema } from '../schemas/roleSchema';
import { roleService } from '../services/roleService';
import { toast } from 'react-toastify';
import RoleVisibilityTree from './RoleVisibilityTree';

interface RoleFormProps {
  roleId?: string;
  onSave?: () => void;
}

const RoleForm: React.FC<RoleFormProps> = ({ roleId, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState<any[]>([]);
  const [showVisibility, setShowVisibility] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(roleSchema),
  });

  useEffect(() => {
    if (roleId) {
      loadRole();
    }
    loadModules();
  }, [roleId]);

  const loadRole = async () => {
    try {
      const response = await roleService.getById(roleId);
      if (response.success) {
        reset(response.data);
        setShowVisibility(true);
      }
    } catch (error) {
      console.error('Error al cargar el rol:', error);
    }
  };

  const loadModules = async () => {
    try {
      const response = await roleService.getModules();
      if (response.success) {
        setModules(response.data);
      }
    } catch (error) {
      console.error('Error al cargar los módulos:', error);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      const response = roleId
        ? await roleService.update(roleId, data)
        : await roleService.create(data);

      if (response.success) {
        toast.success(response.message || 'Rol guardado exitosamente');
        if (!roleId) {
          reset();
        }
        if (onSave) {
          onSave();
        }
        setShowVisibility(true);
      } else {
        toast.error(response.message || 'Error al guardar el rol');
      }
    } catch (error) {
      console.error('Error al guardar el rol:', error);
      toast.error('Error al guardar el rol');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid">
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <Card.Header>
            <h4 className="card-title">{roleId ? 'Editar' : 'Nuevo'} Rol</h4>
          </Card.Header>
          <Card.Body>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Nombre</Form.Label>
                  <Form.Control
                    type="text"
                    {...register('name')}
                    isInvalid={!!errors.name}
                  />
                  {errors.name && (
                    <Form.Control.Feedback type="invalid">
                      {errors.name.message as string}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Descripción</Form.Label>
                  <Form.Control
                    type="text"
                    {...register('description')}
                    isInvalid={!!errors.description}
                  />
                  {errors.description && (
                    <Form.Control.Feedback type="invalid">
                      {errors.description.message as string}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Módulos</Form.Label>
              <div className="row">
                {modules.map((module) => (
                  <div key={module._id} className="col-md-4">
                    <Form.Check
                      type="checkbox"
                      label={module.name}
                      value={module._id}
                      {...register('modules')}
                    />
                  </div>
                ))}
              </div>
            </Form.Group>

            <div className="text-end">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Form>

      {showVisibility && roleId && (
        <div className="mt-4">
          <RoleVisibilityTree roleId={roleId} />
        </div>
      )}
    </div>
  );
};

export default RoleForm; 