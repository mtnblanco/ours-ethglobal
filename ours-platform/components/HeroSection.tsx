import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import TokenCard from './TokenCard';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const HeroSection = () => {
    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    const router = useRouter();
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState<string | null>(null);

    async function handleGetStarted() {
        setIsVerifying(true);
        setVerifyError(null);

        try {
            // Step 1: World ID verification for human proof
            const mod: any = await import("@worldcoin/minikit-js");
            const MiniKit = mod.MiniKit ?? mod.default ?? mod;

            if (!MiniKit) {
                setVerifyError("MiniKit module unavailable");
                setIsVerifying(false);
                return;
            }

            // Ensure MiniKit is installed
            try {
                if (typeof MiniKit.install === "function") {
                    const appId = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID;
                    const installRes = await MiniKit.install(appId);

                    if (installRes && installRes.success === false && installRes.errorCode !== "already_installed") {
                        setVerifyError(installRes.errorMessage || `MiniKit.install failed: ${installRes.errorCode}`);
                        setIsVerifying(false);
                        return;
                    }
                }
            } catch (ie) {
                setVerifyError(String(ie));
                setIsVerifying(false);
                return;
            }

            if (!MiniKit.commandsAsync || typeof MiniKit.commandsAsync.verify !== "function") {
                setVerifyError("'verify' command is unavailable. Check MiniKit.install() or update the World App.");
                setIsVerifying(false);
                return;
            }

            // Execute World ID verification
            const signal = typeof window !== "undefined" ? window.location.href : "signup";
            const payload = { action: "signup", signal };

            const resp = await MiniKit.commandsAsync.verify(payload);

            if (resp?.finalPayload?.status === "success") {
                // World ID verification successful! Redirect to marketplace
                // For now, we skip KYC and go directly to marketplace
                //await requestKYCWithWorldID(resp.finalPayload);
                console.log("World ID verification successful:", resp.finalPayload);
                setIsVerifying(false);
                router.push('/marketplace');
            } else {
                setVerifyError("World ID verification failed or was cancelled");
                setIsVerifying(false);
            }
        } catch (err) {
            console.error("Verification error:", err);
            setVerifyError(String(err));
            setIsVerifying(false);
        }
    }

    // KYC function - commented out for now, going directly to marketplace
    /*
    async function requestKYCWithWorldID(worldIdProof: any) {
      try {
        // Get user's wallet address if available
        let userAddress = "0x0000000000000000000000000000000000000000";
        
        // Try to get wallet address from Web3 provider
        if (typeof window !== "undefined" && (window as any).ethereum) {
          try {
            const accounts = await (window as any).ethereum.request({ 
              method: 'eth_requestAccounts' 
            });
            if (accounts && accounts.length > 0) {
              userAddress = accounts[0];
            }
          } catch (walletError) {
            console.warn("Could not connect to wallet:", walletError);
            // Continue without wallet address - the contract will handle this
          }
        }
  
        // Send World ID proof to backend for KYC processing
        // Following MiniKit documentation format
        const response = await fetch('http://localhost:8000/api/v1/kyc/worldid', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payload: worldIdProof, // Send the complete payload from MiniKit
            action: "signup",
            signal: typeof window !== "undefined" ? window.location.href : "signup",
            user_address: userAddress
          }),
        });
  
        const result = await response.json();
        
        if (result.success) {
          // KYC initiated successfully, redirect to complete profile
          router.push('/register?kyc_initiated=true&tx_hash=' + (result.transaction_hash || ''));
        } else {
          setVerifyError(result.error || "KYC initiation failed");
          setIsVerifying(false);
        }
      } catch (error) {
        console.error("KYC request error:", error);
        setVerifyError("Failed to initiate KYC process");
        setIsVerifying(false);
      }
    }
    */

    return (
        /* --- HERO SECTION --- */
        <section className="relative bg-[#1E2046] overflow-hidden min-h-[850px] flex flex-col lg:flex-row items-center pt-20 lg:pt-0">
            {/* 1. COLUMNA IZQUIERDA (Contenido) */}
            <div className="container mx-auto px-6 relative z-20 h-full pointer-events-none">
                <div className="grid lg:grid-cols-2 h-full items-center">

                    {/* Texto */}
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

                        <button className="bg-[#B0C9FF] hover:bg-[#9ab6f0] text-[#1E2046] px-8 py-4 rounded-lg font-semibold flex items-center gap-2 transition-all duration-300"
                            onClick={handleGetStarted}
                            disabled={isVerifying}
                        >
                            {isVerifying ? "Verifying..." : "Start Investing"}
                            <ArrowRight size={20} />
                        </button>
                        {verifyError && (
                            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-red-400 text-sm">{verifyError}</p>
                            </div>
                        )}
                    </motion.div>

                    {/* Espacio vacío en la grilla para que el texto no ocupe todo el ancho en desktop */}
                    <div className="hidden lg:block"></div>
                </div>
            </div>

            {/* 2. COLUMNA DERECHA (Visual) */}
            <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className={`
                    relative w-full mt-12                    
                    lg:absolute lg:mt-0 lg:right-0 lg:top-[25%] lg:bottom-0 lg:left-[45%] 
                    flex items-center justify-end z-10
                `}
            >
                {/* Wrapper del Asset */}
                <div className="relative w-full max-w-[800px]">

                    {/* IMAGEN DE FONDO (recurso1.svg) */}
                    <img
                        src="recurso1.svg"
                        alt="Background Asset"
                        className="w-full h-auto object-contain ml-auto drop-shadow-2xl"
                    />

                    {/* TOKEN CARD (Superpuesta y centrada) */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                            className="relative left-[15%]"
                            whileHover={{ y: -10 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <TokenCard />
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* CORE FUNCTIONALITY - Texto al final */}
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