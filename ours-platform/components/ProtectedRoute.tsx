'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        } else if (user && !user.kycCompleted) {
            router.push('/kyc');
        }
    }, [isAuthenticated, user, router]);

    if (!isAuthenticated || !user?.kycCompleted) {
        return (
            <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#2D2E63] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[#1E2046] font-semibold">Loading...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
