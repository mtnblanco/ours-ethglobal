'use client';

import { motion } from 'framer-motion';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface ErrorStateProps {
  error?: Error | null;
  onRetry?: () => void;
}

export default function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <section className="bg-[#FFFBF5] py-12">
      <div className="w-full max-w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>

          <h3 className="text-3xl font-bold text-black mb-3">
            Unable to load properties
          </h3>

          <p className="text-black/60 mb-2 max-w-md mx-auto">
            There was an error connecting to the blockchain. Please check your connection and try again.
          </p>

          {error && (
            <details className="mt-4 max-w-md mx-auto">
              <summary className="text-sm text-black/40 cursor-pointer hover:text-black/60">
                Technical details
              </summary>
              <p className="mt-2 text-xs text-red-600 bg-red-50 p-3 rounded border border-red-200 text-left">
                {error.message}
              </p>
            </details>
          )}

          {onRetry && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRetry}
              className="mt-8 inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-bold hover:bg-black/80 transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              Retry
            </motion.button>
          )}
        </motion.div>
      </div>
    </section>
  );
}
