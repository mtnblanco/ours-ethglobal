'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Lock } from 'lucide-react'; // Assuming lucide-react for icons

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-brand-dark flex overflow-hidden relative text-brand-light selection:bg-brand-primary selection:text-brand-dark">

      {/* Background Abstract Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(175,203,255,0.15),transparent_50%)]" />
        {/* Floating Abstract Cubes */}
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-primary/5 blur-[80px] rounded-full"
        />
        <motion.div
          animate={{ y: [0, 30, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-brand-navy/40 border border-brand-primary/10 rotate-12 backdrop-blur-3xl rounded-3xl"
        />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute top-8 left-8 flex items-center gap-3"
        >
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.svg" alt="Ours Logo" className="h-10 w-auto" />
            <img src="/logo tipografico celeste.svg" alt="Ours" className="h-7 w-auto" />
          </Link>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md bg-brand-navy/60 backdrop-blur-xl border border-brand-primary/30 rounded-2xl p-8 shadow-2xl shadow-brand-dark/50"
        >
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-2 text-brand-light">Welcome back</h2>
            <p className="text-brand-light/70 text-sm">Secure access to your real estate portfolio.</p>
          </div>

          <form className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-light/80 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                className="w-full bg-brand-dark/50 border border-brand-primary/30 rounded-lg px-4 py-3 text-brand-light placeholder-brand-light/40 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all duration-300"
                placeholder="name@company.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-brand-light/80">
                  Password
                </label>
                <Link href="#" className="text-sm text-brand-primary hover:text-brand-accent transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                className="w-full bg-brand-dark/50 border border-brand-primary/30 rounded-lg px-4 py-3 text-brand-light placeholder-brand-light/40 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all duration-300"
                placeholder="••••••••"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-accent text-brand-dark font-bold py-3 px-4 rounded-lg transition-colors duration-300"
            >
              <Lock className="w-4 h-4" />
              Sign in securely
            </motion.button>
          </form>

          <div className="mt-8 pt-6 border-t border-brand-primary/20 text-center">
            <p className="text-sm text-brand-light/70">
              Not a member?{' '}
              <Link href="/register" className="text-brand-primary font-semibold hover:text-brand-accent transition-colors">
                Create account
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Footer Trust Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-brand-light/60 text-xs flex items-center gap-2"
        >
          <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
          <span>Encrypted End-to-End Connection • Banking Grade Security</span>
        </motion.div>

      </div>
    </div>
  );
}