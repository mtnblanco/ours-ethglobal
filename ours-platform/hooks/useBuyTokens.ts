import { useState, useCallback } from 'react';
import { Address, erc20Abi } from 'viem';
import { MiniKit } from '@worldcoin/minikit-js';

// Asumimos que esta importación trae los ABI y direcciones necesarias
import { CONTRACT_ADDRESSES, SALE_MANAGER_ABI } from '@/lib/contracts';

// Las variables de entorno DEBEN estar configuradas para World Chain Sepolia
// USDC_ADDRESS para WCS: 0x5dEd3c7441BC7B4E3d12F69462f518C7b49C9388
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as Address;
const USDC_DECIMALS = 6;
const PROPERTY_TOKEN_DECIMALS = 18; // Asumimos que el token de la propiedad usa 18 decimales

export interface BuyTokensParams {
  propertyAddress: Address;
  tokenAmount: bigint; // Cantidad del token de la propiedad (asumimos 18 decimales)
  pricePerToken: bigint; // Precio por token de la propiedad en USDC (asumimos 6 decimales)
}

export function useBuyTokens() {
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  /**
   * Buy tokens using MiniKit sendTransaction
   */
  const buyTokens = useCallback(async ({ propertyAddress, tokenAmount, pricePerToken }: BuyTokensParams) => {
    try {
      setError(null);
      setIsPending(true);
      setIsConfirmed(false);

      // --- 1. Verificación de MiniKit ---
      if (!MiniKit.isInstalled() || !MiniKit.commandsAsync?.sendTransaction) {
        throw new Error('MiniKit no está disponible. Por favor, abre esta app en la World App más reciente para realizar la compra.');
      }

      // --- 2. Cálculo del costo total en USDC (6 decimales) ---
      // tokenAmount (18 dec) * pricePerToken (6 dec) = 24 dec. 
      // Dividir por 10^18 para reducir a 6 dec (que es lo que el contrato USDC espera).
      const totalCost = (tokenAmount * pricePerToken) / BigInt(10 ** PROPERTY_TOKEN_DECIMALS);
      
      if (totalCost <= 0) {
          throw new Error("El costo total es cero o inválido. Revisa la cantidad de tokens y el precio.");
      }

      console.log('🚀 Iniciando compra de tokens. Datos de la transacción:', {
        propertyAddress,
        tokenAmount: tokenAmount.toString(),
        pricePerToken: pricePerToken.toString(),
        totalCostInUSDC_6_Decimals: totalCost.toString(),
        totalCostFormatted: Number(totalCost) / Math.pow(10, USDC_DECIMALS),
      });

      // El flujo de transacción consta de dos partes: Aprobación y Compra.
      // 

      // --- Paso 1: Aprobar el gasto de USDC al SaleManager ---
      console.log('--- Paso 1: Aprobando USDC...');
      
      const { finalPayload: approvePayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: USDC_ADDRESS,
            abi: erc20Abi,
            functionName: 'approve',
            args: [CONTRACT_ADDRESSES.SALE_MANAGER as Address, totalCost],
          },
        ],
      });

      console.log('Respuesta de Aprobación:', approvePayload);

      if (approvePayload.status === 'error') {
        if (approvePayload.error_code === 'disallowed_operation') {
          // El mismo error que el usuario está viendo, con la causa más probable
          throw new Error(
            'Transacción no permitida (disallowed_operation). Esto indica que World App ha rechazado la solicitud.\n' +
            'Las causas son casi siempre externas al código:\n' +
            '1. La red activa en tu World App NO es World Chain Sepolia (WCS).\n' +
            '2. Tu App ID en el Portal de Desarrolladores de Worldcoin NO tiene permisos de transacción habilitados para WCS.\n' +
            '3. El contrato de USDC o el SaleManager que estás usando no está en la lista blanca de contratos permitidos para tu app.'
          );
        }

        throw new Error(`Fallo al aprobar USDC: ${approvePayload.error_code || 'Error desconocido'}`);
      }

      if (approvePayload.status !== 'success') {
        throw new Error('La aprobación de USDC no fue exitosa.');
      }

      console.log('USDC aprobado. Hash de la transacción:', approvePayload.transaction_id);

      // --- Paso 2: Comprar fracciones ---
      console.log('--- Paso 2: Comprando fracciones...');
      setIsPending(false);
      setIsConfirming(true);

      const { finalPayload: buyPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: CONTRACT_ADDRESSES.SALE_MANAGER as Address,
            abi: SALE_MANAGER_ABI,
            functionName: 'buyFractions',
            args: [propertyAddress, tokenAmount],
          },
        ],
      });

      if (buyPayload.status === 'error') {
        throw new Error(buyPayload.error_code || 'Fallo al comprar tokens');
      }

      if (buyPayload.status !== 'success') {
        throw new Error('La compra de tokens no fue exitosa.');
      }

      console.log('Compra exitosa. Hash de la transacción:', buyPayload.transaction_id);

      setHash(buyPayload.transaction_id || null);
      setIsConfirming(false);
      setIsConfirmed(true);

      return {
        success: true,
        transactionId: buyPayload.transaction_id,
        hash: buyPayload.transaction_id,
      };
    } catch (err: any) {
      console.error('Error general en la compra de tokens:', err);
      const errorMessage = err.message || 'Fallo general al comprar tokens';
      setError(errorMessage);
      setIsPending(false);
      setIsConfirming(false);
      return { success: false, error: errorMessage };
    } finally {
        setIsPending(false);
        setIsConfirming(false);
    }
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setIsPending(false);
    setIsConfirming(false);
    setIsConfirmed(false);
    setError(null);
    setHash(null);
  }, []);

  return {
    buyTokens,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
    reset,
  };
}