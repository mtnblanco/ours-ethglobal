'use client';

import { useState, useEffect } from 'react';

interface WorldIDUser {
  address: string;
  verified: boolean;
  nullifierHash?: string;
}

export function useWorldID() {
  const [user, setUser] = useState<WorldIDUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWorldApp, setIsWorldApp] = useState(false);

  useEffect(() => {
    const initializeWorldID = async () => {
      try {
        // Check if we're in World App context
        let worldAppAvailable = false;
        
        try {
          const mod: any = await import("@worldcoin/minikit-js");
          const MiniKit = mod.MiniKit ?? mod.default?.MiniKit ?? mod;
          
          if (MiniKit && typeof MiniKit.isInstalled === 'function') {
            worldAppAvailable = MiniKit.isInstalled();
            setIsWorldApp(worldAppAvailable);
          }
        } catch (err) {
          console.log('MiniKit not available:', err);
        }

        // For demo purposes, always provide a connected user
        // In production, this would only be set after proper World ID verification
        const deployerAddress = '0xAbdFF83ac5E8E729C6ce44E938f244fB12F6Ce32';
        
        setUser({
          address: deployerAddress,
          verified: true, // Auto-verify for demo
          nullifierHash: 'demo_nullifier_hash'
        });

        setIsLoading(false);
      } catch (err) {
        console.error('World ID initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize World ID');
        setIsLoading(false);
      }
    };

    // Simulate initialization time
    setTimeout(initializeWorldID, 500);
  }, []);

  const verifyWorldID = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // For demo, just ensure user is set
      if (!user) {
        const deployerAddress = '0xAbdFF83ac5E8E729C6ce44E938f244fB12F6Ce32';
        setUser({
          address: deployerAddress,
          verified: true,
          nullifierHash: 'demo_nullifier_hash'
        });
      }
      
      // Simulate verification process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUser(prev => prev ? { ...prev, verified: true } : null);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('World ID verification error:', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
      setIsLoading(false);
      return false;
    }
  };

  const sendTransaction = async (transaction: any): Promise<string> => {
    try {
      if (!user?.address) {
        throw new Error('No wallet connected');
      }

      console.log('Sending transaction via World ID:', transaction);
      
      // For demo, simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock transaction hash
      const mockTxHash = '0x' + Math.random().toString(16).slice(2, 66);
      console.log('Transaction sent:', mockTxHash);
      
      return mockTxHash;
      
    } catch (err) {
      console.error('Transaction error:', err);
      throw err;
    }
  };

  return {
    user,
    isLoading,
    error,
    isWorldApp,
    isConnected: !!user?.address,
    isVerified: !!user?.verified,
    verifyWorldID,
    sendTransaction,
  };
}