import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import TokenCard from './TokenCard';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// Importamos los tipos necesarios de MiniKit
import { MiniKit, WalletAuthInput, MiniAppWalletAuthSuccessPayload } from '@worldcoin/minikit-js';

const HeroSection = () => {
    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    // 1. Inicializar MiniKit al montar el componente
    useEffect(() => {
        try {
            MiniKit.install(process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID);
            console.log("MiniKit installed");
        } catch (error) {
            console.error("Error installing MiniKit:", error);
        }
    }, []);

    // Función principal de Login (Wallet Authentication)
    const handleLogin = async () => {
        setIsLoading(true);
        setAuthError(null);

        // Verificamos si estamos dentro de World App
        if (!MiniKit.isInstalled()) {
            setAuthError("MiniKit no está instalado. Por favor abre esta aplicación desde World App.");
            setIsLoading(false);
            return;
        }

        try {
            // PASO A: Obtener un 'nonce' fresco desde tu backend
            // Esto es crucial para la seguridad (evita ataques de replay)
            const nonceRes = await fetch(`/api/nonce`);
            if (!nonceRes.ok) throw new Error("Error fetching nonce from backend");
            
            const { nonce } = await nonceRes.json();

            // PASO B: Configurar el comando de Wallet Auth (SIWE)
            const walletAuthInput: WalletAuthInput = {
                nonce: nonce,
                requestId: '0', // Opcional
                expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 7 días
                notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000), // 1 día antes (margen error reloj)
                statement: 'Sign in to RWA Platform to manage your Real Estate Assets.',
            };

            // PASO C: Ejecutar el comando en MiniKit
            console.log("Solicitando firma de wallet...");
            const { finalPayload } = await MiniKit.commandsAsync.walletAuth(walletAuthInput);

            // PASO D: Verificar el resultado
            if (finalPayload.status === 'success') {
                console.log("✅ Firma exitosa, verificando en backend...");

                // Enviamos la firma y el nonce original al backend para validación final
                const verifyRes = await fetch('/api/complete-siwe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        payload: finalPayload, // Contiene signature, address, etc.
                        nonce,
                    }),
                });

                const verifyData = await verifyRes.json();

                if (verifyData.status === 'success' && verifyData.isValid) {
                    console.log("✅ Login completado.");
                    // Redirigir al usuario
                    router.push('/marketplace');
                } else {
                    setAuthError("La validación de la firma falló en el servidor.");
                }
            } else {
                // El usuario canceló o hubo un error en la app
                setAuthError("Autenticación cancelada o fallida.");
            }

        } catch (err) {
            console.error("Error en proceso de login:", err);
            setAuthError("Ocurrió un error inesperado durante la conexión.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="relative bg-[#1E2046] overflow-hidden min-h-[850px] flex flex-col lg:flex-row items-center pt-20 lg:pt-0">
            <div className="container mx-auto px-6 relative z-20 h-full pointer-events-none">
                <div className="grid lg:grid-cols-2 h-full items-center">

                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeIn}
                        className="text-[#B0C9FF] pointer-events-auto max-w-xl pt-10 lg:pt-0"
                    >
                        <div className="inline-block mb-6">
                            <span className="border border-[#B0C9FF]/30 px-5 py-2 rounded-full text-xs md:text-sm tracking-widest font-semibold uppercase backdrop-blur-md bg-[#B0C9FF]/5 text-[#B0C9FF]">
                                Regulated RWA Platform
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-6xl lg:text-7xl leading-[1.1] mb-8 text-[#B0C9FF]">
                            <span className="font-light">Real Estate</span> <br />
                            <span className="font-bold">Tokenization</span> <br />
                            <span className="font-light">Infrastructure</span>
                        </h1>

                        <Link href="/login" className="hidden sm:block text-sm font-medium text-brand-light hover:text-brand-primary py-2 px-4 transition-colors">Log in</Link>

                        <button 
                            className={`bg-[#B0C9FF] hover:bg-[#9ab6f0] text-[#1E2046] px-8 py-4 rounded-lg font-semibold flex items-center gap-2 transition-all duration-300 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                            onClick={handleLogin} // Usamos la nueva función handleLogin
                            disabled={isLoading}
                        >
                            {isLoading ? "Connecting Wallet..." : "Start Investing"}
                            {!isLoading && <ArrowRight size={20} />}
                        </button>
                        
                        {authError && (
                            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-red-400 text-sm">{authError}</p>
                            </div>
                        )}
                    </motion.div>

                    <div className="hidden lg:block"></div>
                </div>
            </div>

            <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="relative w-full mt-12 lg:absolute lg:mt-0 lg:right-0 lg:top-[25%] lg:bottom-0 lg:left-[45%] flex items-center justify-end z-10"
            >
                <div className="relative w-full max-w-[800px]">
                    <img src="recurso1.svg" alt="Background Asset" className="w-full h-auto object-contain ml-auto drop-shadow-2xl" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div className="relative left-[15%]" whileHover={{ y: -10 }} transition={{ type: "spring", stiffness: 300 }}>
                            <TokenCard />
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            <div className="absolute bottom-2 left-1 right-0 z-30">
                <div className="container mx-auto">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                        className="text-4xl font-bold text-[#B0C9FF] text-right lg:pr-12"
                    >
                        Core Functionality
                    </motion.h2>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;