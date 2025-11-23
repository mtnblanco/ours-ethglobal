"use client";

import React from "react";
import { MiniKitProvider } from "@worldcoin/minikit-js/minikit-provider";

// We install MiniKit on mount with the provided app id so commands like verify() are available.
import { useEffect, useState } from "react";

async function ensureInstalled(appId?: string) {
  console.log('🚀 [MiniKitProvider] Attempting to install MiniKit with appId:', appId);

  try {
    const mod: any = await import("@worldcoin/minikit-js");
    const MiniKit = mod.MiniKit ?? mod.default?.MiniKit ?? mod;

    console.log('🚀 [MiniKitProvider] MiniKit module loaded:', {
      hasMiniKit: !!MiniKit,
      hasInstall: typeof MiniKit?.install === 'function',
      hasIsInstalled: typeof MiniKit?.isInstalled === 'function',
    });

    if (MiniKit && typeof MiniKit.install === "function") {
      // install will return an object indicating success or error
      const res = await MiniKit.install(appId);

      console.log('🚀 [MiniKitProvider] MiniKit.install result:', res);

      if (!res || res.success === false) {
        console.warn("⚠️ [MiniKitProvider] MiniKit.install returned error:", res);
      } else {
        console.log('✅ [MiniKitProvider] MiniKit installed successfully');

        // Verify installation
        try {
          const isInstalled = MiniKit.isInstalled();
          console.log('✅ [MiniKitProvider] MiniKit.isInstalled():', isInstalled);
        } catch (e) {
          console.error('❌ [MiniKitProvider] MiniKit.isInstalled() failed:', e);
        }
      }

      return res;
    } else {
      console.error('❌ [MiniKitProvider] MiniKit.install is not a function');
    }
  } catch (err) {
    console.error("❌ [MiniKitProvider] Failed to import/install MiniKit:", err);
  }
}

export default function MinikitProviderClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID;

    console.log('🔧 [MiniKitProvider] Initializing with:', {
      appId,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
      isClient: typeof window !== 'undefined',
    });

    // attempt to install MiniKit with the app id (if provided)
    ensureInstalled(appId).then((res) => {
      if (res && res.success !== false) {
        setIsInstalled(true);
        console.log('✅ [MiniKitProvider] Installation complete');
      }
    });
  }, []);

  return <MiniKitProvider>{children}</MiniKitProvider>;
}
