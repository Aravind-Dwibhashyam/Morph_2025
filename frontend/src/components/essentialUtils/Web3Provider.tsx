'use client';

import { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { sepolia, anvil } from "wagmi/chains";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { morphTestnet } from '@/lib/chains/morphTestnet';

const config = getDefaultConfig({
  appName: process.env.NEXT_PUBLIC_APP_NAME ||"SafeSpend Family Wallet",
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID || "",
  chains: [sepolia, anvil, morphTestnet],
  ssr: true,
});

const queryClient = new QueryClient();

export default function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize="compact" initialChain={morphTestnet} // THIS fixes the errorCorrection prop issue
        showRecentTransactions={false}> 
          {children} 
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
