'use client';

import { motion } from 'framer-motion';

export default function LoadingState() {
  return (
    <section className="bg-[#FFFBF5] py-12">
      <div className="w-full max-w-full">
        <div className="flex flex-col gap-[10px]">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className={`relative w-full flex ${
                index % 2 === 0 ? 'justify-start' : 'justify-end'
              } overflow-hidden`}
            >
              <div className={`${index % 2 === 0 ? 'mr-[5%] md:mr-[10%]' : 'ml-[5%] md:ml-[10%]'} py-8 w-full flex ${index % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <motion.div
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    repeatType: 'reverse',
                  }}
                  className="relative bg-white border-2 border-black/10 rounded-[30px] p-5 w-full max-w-[600px]"
                  style={{ minHeight: '420px' }}
                >
                  {/* Image skeleton */}
                  <div className="mb-4">
                    <div className="relative h-40 w-full rounded-2xl bg-black/5 animate-pulse" />
                  </div>

                  {/* Title skeleton */}
                  <div className="mb-4 space-y-2">
                    <div className="h-6 bg-black/5 rounded w-3/4 animate-pulse" />
                    <div className="h-4 bg-black/5 rounded w-1/2 animate-pulse" />
                  </div>

                  {/* Stats skeleton */}
                  <div className="space-y-4 mt-8">
                    <div className="flex justify-between">
                      <div className="space-y-2">
                        <div className="h-3 bg-black/5 rounded w-16 animate-pulse" />
                        <div className="h-5 bg-black/5 rounded w-12 animate-pulse" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-black/5 rounded w-20 animate-pulse" />
                        <div className="h-5 bg-black/5 rounded w-16 animate-pulse" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <div className="h-3 bg-black/5 rounded w-12 animate-pulse" />
                        <div className="h-3 bg-black/5 rounded w-8 animate-pulse" />
                      </div>
                      <div className="h-[2px] bg-black/5 rounded-full animate-pulse" />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="inline-block w-8 h-8 border-4 border-black/20 border-t-black rounded-full"
          />
          <p className="mt-4 text-black/60 font-bold">Loading properties from blockchain...</p>
        </div>
      </div>
    </section>
  );
}
