import { http, createConfig } from 'wagmi';
import { worldchainSepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [worldchainSepolia],
  connectors: [
    injected(), // MetaMask and other injected wallets
  ],
  transports: {
    [worldchainSepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
  },
  ssr: true,
});
