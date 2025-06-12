"use client"
import React from 'react'
import UsersTable from './common/UsersTable'
import ProtectedPage from './ProtectedPage'
import ProtectedModule from './ProtectedModule'
import { useUserRoleStore } from '@/stores';

export default function UsersPage() {
    const { role, hasRole } = useUserRoleStore();

    console.log('Rol actual:', role);
    console.log('¿Tiene rol Super Admin?:', hasRole('Super Admin'));
    console.log('¿Tiene rol Admin?:', hasRole('Admin'));

    return (
        <ProtectedPage>
            <ProtectedModule
                moduleName="users"
                requiredPermissions={['read']}
                allowedRoles={['Super Admin', 'Admin']}
            >
                <div>
                    <UsersTable />
                </div>
            </ProtectedModule>
        </ProtectedPage>
    )
}