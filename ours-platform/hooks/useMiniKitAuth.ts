import { useState, useEffect, useCallback } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { Address } from 'viem';

interface MiniKitAuthState {
  address: Address | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useMiniKitAuth() {
  const [state, setState] = useState<MiniKitAuthState>({
    address: null,
    isConnected: false,
    isLoading: true,
    error: null,
  });

  // Check if running in MiniKit environment
  const isMiniKit = typeof window !== 'undefined' && MiniKit.isInstalled();

  // Authenticate with World App
  const authenticate = useCallback(async () => {
    if (!isMiniKit) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Not running in World App. Please open this app in World App.',
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Generate a nonce for authentication (must be at least 8 characters)
      const nonce = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const requestId = `auth-${Date.now()}`;

      console.log('Authenticating with MiniKit...');

      // Request wallet authentication from World App
      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce,
        requestId,
        expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
        notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000), // 24 hours ago
        statement: 'Sign in to OURS Marketplace to invest in tokenized real estate',
      });

      if (finalPayload.status === 'error') {
        throw new Error(finalPayload.error_code || 'Authentication failed');
      }

      if (finalPayload.status !== 'success') {
        throw new Error('Authentication was not successful');
      }

      // Extract address from the response
      const userAddress = finalPayload.address as Address;

      console.log('Authentication successful, address:', userAddress);

      setState({
        address: userAddress,
        isConnected: true,
        isLoading: false,
        error: null,
      });

      // Store address in localStorage for persistence
      localStorage.setItem('minikit_address', userAddress);

      return userAddress;
    } catch (err: any) {
      console.error('MiniKit authentication error:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || 'Failed to authenticate with World App',
      }));
      return null;
    }
  }, [isMiniKit]);

  // Disconnect
  const disconnect = useCallback(() => {
    setState({
      address: null,
      isConnected: false,
      isLoading: false,
      error: null,
    });
    localStorage.removeItem('minikit_address');
  }, []);

  // Auto-connect on mount if address exists in localStorage
  useEffect(() => {
    if (!isMiniKit) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Not running in World App',
      }));
      return;
    }

    const storedAddress = localStorage.getItem('minikit_address');
    if (storedAddress) {
      setState({
        address: storedAddress as Address,
        isConnected: true,
        isLoading: false,
        error: null,
      });
    } else {
      // Auto-authenticate when component mounts
      authenticate();
    }
  }, [isMiniKit, authenticate]);

  return {
    address: state.address,
    isConnected: state.isConnected,
    isLoading: state.isLoading,
    error: state.error,
    isMiniKit,
    authenticate,
    disconnect,
  };
}
