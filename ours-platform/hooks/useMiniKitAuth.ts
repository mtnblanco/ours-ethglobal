import { useState, useEffect, useCallback } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { Address } from 'viem';

interface MiniKitAuthState {
  address: Address | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  isMiniKit: boolean;
}

export function useMiniKitAuth() {
  const [state, setState] = useState<MiniKitAuthState>({
    address: null,
    isConnected: false,
    isLoading: true,
    error: null,
    isMiniKit: false,
  });

  // Authenticate with World App
  const authenticate = useCallback(async () => {
    // Check MiniKit availability at authentication time
    let miniKitAvailable = false;
    try {
      miniKitAvailable = MiniKit.isInstalled();
    } catch (e) {
      console.error('MiniKit.isInstalled() check failed:', e);
    }

    if (!miniKitAvailable) {
      const errorMsg = 'Not running in World App. Please open this app in World App.';
      console.error(errorMsg);
      setState(prev => ({
        ...prev,
        isLoading: false,
        isMiniKit: false,
        error: errorMsg,
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null, isMiniKit: true }));

      // Generate a nonce for authentication (must be at least 8 characters)
      const nonce = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const requestId = `auth-${Date.now()}`;

      console.log('🔐 Authenticating with MiniKit...', {
        nonce,
        requestId,
        miniKitAvailable,
        hasCommandsAsync: !!MiniKit.commandsAsync,
        hasWalletAuth: !!MiniKit.commandsAsync?.walletAuth,
      });

      // Request wallet authentication from World App
      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce,
        requestId,
        expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
        notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000), // 24 hours ago
        statement: 'Sign in to OURS Marketplace to invest in tokenized real estate',
      });

      console.log('🔐 WalletAuth response:', finalPayload);

      if (finalPayload.status === 'error') {
        throw new Error(finalPayload.error_code || 'Authentication failed');
      }

      if (finalPayload.status !== 'success') {
        throw new Error('Authentication was not successful');
      }

      // Extract address from the response
      const userAddress = finalPayload.address as Address;

      console.log('✅ Authentication successful, address:', userAddress);

      setState({
        address: userAddress,
        isConnected: true,
        isLoading: false,
        error: null,
        isMiniKit: true,
      });

      // Store address in localStorage for persistence
      localStorage.setItem('minikit_address', userAddress);

      return userAddress;
    } catch (err: any) {
      console.error('❌ MiniKit authentication error:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || 'Failed to authenticate with World App',
      }));
      return null;
    }
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    setState({
      address: null,
      isConnected: false,
      isLoading: false,
      error: null,
      isMiniKit: false,
    });
    localStorage.removeItem('minikit_address');
  }, []);

  // Auto-connect on mount - check MiniKit and authenticate
  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 10;

    const initAuth = async () => {
      // Try multiple times with increasing delays
      while (mounted && retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(`🔄 [Attempt ${retryCount}/${MAX_RETRIES}] Checking MiniKit...`);

        // Wait progressively longer
        await new Promise(resolve => setTimeout(resolve, retryCount * 200));

        if (!mounted) return;

        // Check if MiniKit is available
        let miniKitAvailable = false;
        try {
          miniKitAvailable = MiniKit.isInstalled();
        } catch (e) {
          console.warn(`⚠️ [Attempt ${retryCount}] MiniKit.isInstalled() check failed:`, e);
          continue; // Try again
        }

        console.log(`🔍 [Attempt ${retryCount}] MiniKit initialization check:`, {
          miniKitAvailable,
          hasCommandsAsync: !!MiniKit.commandsAsync,
          hasWalletAuth: !!MiniKit.commandsAsync?.walletAuth,
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
        });

        if (!miniKitAvailable) {
          console.warn(`⚠️ [Attempt ${retryCount}] MiniKit not available yet, retrying...`);

          // On last attempt, give up
          if (retryCount >= MAX_RETRIES) {
            console.error('❌ MiniKit not available after max retries');
            setState(prev => ({
              ...prev,
              isLoading: false,
              isMiniKit: false,
              error: 'Not running in World App',
            }));
            return;
          }
          continue; // Try again
        }

        // MiniKit is available!
        console.log(`✅ [Attempt ${retryCount}] MiniKit is available!`);
        setState(prev => ({ ...prev, isMiniKit: true }));

        // Check for stored address
        const storedAddress = localStorage.getItem('minikit_address');
        if (storedAddress) {
          console.log('✅ Found stored address:', storedAddress);
          setState({
            address: storedAddress as Address,
            isConnected: true,
            isLoading: false,
            error: null,
            isMiniKit: true,
          });
          return; // Success!
        } else {
          // Force authentication
          console.log('🔐 No stored address, forcing authentication...');
          await authenticate();
          return; // Success!
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [authenticate]);

  return {
    address: state.address,
    isConnected: state.isConnected,
    isLoading: state.isLoading,
    error: state.error,
    isMiniKit: state.isMiniKit,
    authenticate,
    disconnect,
  };
}
