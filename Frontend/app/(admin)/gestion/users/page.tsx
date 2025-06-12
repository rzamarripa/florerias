import PageBreadcrumb from '@/components/layout/PageBreadcrumb'
import UsersPage from '@/features/users/components/UsersPage'
import React from 'react'

export default function page() {
    return (
        <div>
            <PageBreadcrumb
                title={'Gestion'}
                subtitle={'Usuarios'}
            />
            <UsersPage />
        </div>
    )
}
