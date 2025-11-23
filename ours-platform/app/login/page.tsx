'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, Globe, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated, user } = useAuth();
    const [isVerifying, setIsVerifying] = useState(false);
    const [isWorldAppAvailable, setIsWorldAppAvailable] = useState(false);

    useEffect(() => {
        // Check if we're in World App context
        const checkWorldApp = async () => {
            try {
                const mod: any = await import('@worldcoin/minikit-js');
                const MiniKit = mod.MiniKit ?? mod.default?.MiniKit ?? mod;

                if (MiniKit && typeof MiniKit.isInstalled === 'function') {
                    const installed = MiniKit.isInstalled();
                    setIsWorldAppAvailable(installed);
                }
            } catch (err) {
                console.log('World App not available:', err);
                setIsWorldAppAvailable(false);
            }
        };

        checkWorldApp();
    }, []);

    useEffect(() => {
        if (isAuthenticated && user) {
            if (!user.kycCompleted) {
                router.push('/kyc');
            } else {
                router.push('/marketplace');
            }
        }
    }, [isAuthenticated, user, router]);

    const handleWorldIDVerification = async () => {
        setIsVerifying(true);

        try {
            if (!isWorldAppAvailable) {
                // For demo purposes, simulate verification
                await new Promise(resolve => setTimeout(resolve, 2000));
                const mockWorldId = `world_${Math.random().toString(36).substring(7)}`;
                const mockProof = {
                    merkle_root: "0x123...",
                    nullifier_hash: "0x456...",
                    proof: "0x789...",
                    verification_level: "orb"
                };

                login(mockWorldId, mockProof);
                setIsVerifying(false);
                return;
            }

            // Real World ID verification
            const mod: any = await import('@worldcoin/minikit-js');
            const MiniKit = mod.MiniKit ?? mod.default?.MiniKit ?? mod;

            if (typeof MiniKit.install === 'function') {
                const appId = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID;
                const installRes = await MiniKit.install(appId);

                if (installRes && installRes.success === false) {
                    if (installRes.errorCode !== 'already_installed') {
                        throw new Error(installRes.errorMessage || `MiniKit.install failed: ${installRes.errorCode}`);
                    }
                }
            }

            if (MiniKit.commandsAsync && typeof MiniKit.commandsAsync.verify === 'function') {
                const signal = typeof window !== 'undefined' ? window.location.href : 'login';
                const payload = { action: 'login', signal };

                const resp = await MiniKit.commandsAsync.verify(payload);

                if (resp?.finalPayload?.status === 'success') {
                    const worldId = resp.finalPayload.nullifier_hash || `world_${Math.random().toString(36).substring(7)}`;
                    login(worldId, resp.finalPayload);
                }
            }
        } catch (err) {
            console.error('Verification error:', err);
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FFFBF5] overflow-x-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle, #1E2046 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }} />
            </div>

            <main className="relative pt-20 pb-16 px-4 md:px-6">
                <div className="container mx-auto max-w-6xl">

                    {/* Logo and Back */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12"
                    >
                        <Link href="/" className="inline-flex items-center gap-2 text-[#1E2046]/70 hover:text-[#1E2046] transition-colors mb-8">
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-semibold">Back to Home</span>
                        </Link>
                        <img
                            src="/logo con todo.svg"
                            alt="Ours Logo"
                            className="w-48"
                        />
                    </motion.div>

                    {/* Main Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                        {/* Left Column - Info */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-8"
                        >
                            <div>
                                <h1 className="text-4xl md:text-5xl font-bold text-[#1E2046] mb-4">
                                    Secure Access with World ID
                                </h1>
                                <p className="text-xl text-[#1E2046]/70">
                                    Verify your humanity and access tokenized real estate investments
                                </p>
                            </div>

                            {/* Benefits */}
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-[#B0CBFF]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Shield className="w-6 h-6 text-[#2D2E63]" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[#1E2046] mb-1">
                                            Privacy-Preserving
                                        </h3>
                                        <p className="text-[#1E2046]/60">
                                            Zero-knowledge proof ensures your identity remains private
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-[#B0CBFF]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <CheckCircle className="w-6 h-6 text-[#2D2E63]" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[#1E2046] mb-1">
                                            One-Time Verification
                                        </h3>
                                        <p className="text-[#1E2046]/60">
                                            Verify once and access all features securely
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-[#B0CBFF]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Globe className="w-6 h-6 text-[#2D2E63]" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[#1E2046] mb-1">
                                            Global Access
                                        </h3>
                                        <p className="text-[#1E2046]/60">
                                            Invest in properties worldwide with regulatory compliance
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Right Column - Login Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div className="bg-white rounded-3xl border-2 border-black p-8 shadow-2xl">
                                <div className="text-center mb-8">
                                    <div className="w-20 h-20 bg-[#2D2E63] rounded-full mx-auto mb-6 flex items-center justify-center">
                                        <Globe className="w-10 h-10 text-[#B0CBFF]" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-[#1E2046] mb-2">
                                        Welcome to Ours
                                    </h2>
                                    <p className="text-[#1E2046]/60">
                                        Verify with World ID to continue
                                    </p>
                                </div>

                                {/* World ID Button */}
                                <button
                                    onClick={handleWorldIDVerification}
                                    disabled={isVerifying}
                                    className="w-full bg-[#2D2E63] text-[#B0CBFF] py-4 px-6 rounded-xl font-bold text-lg hover:bg-[#1E2046] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
                                >
                                    {isVerifying ? (
                                        <>
                                            <div className="w-6 h-6 border-3 border-[#B0CBFF] border-t-transparent rounded-full animate-spin" />
                                            <span>Verifying...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Globe className="w-6 h-6" />
                                            <span>Verify with World ID</span>
                                        </>
                                    )}
                                </button>

                                <div className="mt-6 pt-6 border-t border-black/10">
                                    <p className="text-xs text-center text-[#1E2046]/50">
                                        By continuing, you agree to our Terms of Service and Privacy Policy. Your identity is verified using World ID's proof of personhood protocol.
                                    </p>
                                </div>
                            </div>

                            {/* Info Card */}
                            <div className="mt-6 bg-[#B0CBFF]/10 rounded-2xl border border-[#B0CBFF]/30 p-6">
                                <h3 className="font-bold text-[#1E2046] mb-2 flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    What is World ID?
                                </h3>
                                <p className="text-sm text-[#1E2046]/70">
                                    World ID is a privacy-preserving digital identity that proves you're a unique human. It uses zero-knowledge proofs to verify your identity without revealing personal information.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
}
