// components/auth/ProtectedPage.tsx
"use client";

import { useUserSessionStore } from "@/stores/userSessionStore";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { Spinner } from "react-bootstrap";

interface ProtectedPageProps {
    children: ReactNode;
    redirectTo?: string;
}

const ProtectedPage = ({
    children,
    redirectTo = "/auth-2/sign-in"
}: ProtectedPageProps) => {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useUserSessionStore();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace(redirectTo);
        }
    }, [isAuthenticated, isLoading, router, redirectTo]);

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
                <div className="text-center">
                    <Spinner animation="border" variant="primary" className="mb-3" />
                    <p className="text-muted">Verificando autenticación...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
};

export default ProtectedPage;