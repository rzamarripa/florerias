'use client';

import React, { useEffect, useState } from 'react';
import { Card, Form, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import UserVisibilityTree from './RoleVisibilityTree';
import { usersService } from '../../users/services/users';
import { User } from '../../users/types';

interface UserVisibilitySelectorProps {
    onUserChange?: (userId: string | null) => void;
}

const UserVisibilitySelector: React.FC<UserVisibilitySelectorProps> = ({ onUserChange }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const response = await usersService.getAllUsers({ limit: 1000 });
            if (response.data) {
                setUsers(response.data);
            }
        } catch (error: any) {
            toast.error('Error al cargar los usuarios: ' + (error.message || 'Error desconocido'));
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const userId = e.target.value;
        setSelectedUserId(userId);
        onUserChange?.(userId || null);
    };

    return (
        <div>
            <Card className="mb-4">
                <Card.Header>
                    <h4 className="card-title">Seleccionar Usuario</h4>
                    <p className="text-muted mb-0">
                        Selecciona un usuario para configurar su visibilidad de acceso a razones sociales, marcas y sucursales.
                    </p>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Usuario</Form.Label>
                                <Form.Select
                                    value={selectedUserId}
                                    onChange={handleUserChange}
                                    disabled={loading}
                                >
                                    <option value="">Selecciona un usuario...</option>
                                    {users.map((user) => (
                                        <option key={user._id} value={user._id}>
                                            {user.profile.fullName} ({user.username})
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {selectedUserId && (
                <UserVisibilityTree userId={selectedUserId} />
            )}
        </div>
    );
};

export default UserVisibilitySelector; 