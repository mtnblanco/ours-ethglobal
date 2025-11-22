"use client";

import React from "react";
import { MiniKitProvider } from "@worldcoin/minikit-js/minikit-provider";

// We install MiniKit on mount with the provided app id so commands like verify() are available.
import { useEffect } from "react";

async function ensureInstalled(appId?: string) {
  try {
    const mod: any = await import("@worldcoin/minikit-js");
    const MiniKit = mod.MiniKit ?? mod.default?.MiniKit ?? mod;
    if (MiniKit && typeof MiniKit.install === "function") {
      // install will return an object indicating success or error; we ignore failures here but log them
      const res = await MiniKit.install(appId);
      // eslint-disable-next-line no-console
      if (!res || res.success === false) console.warn("MiniKit.install returned:", res);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("Failed to import/install MiniKit:", err);
  }
}

export default function MinikitProviderClient({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID;
    // attempt to install MiniKit with the app id (if provided)
    ensureInstalled(appId);
  }, []);

  return <MiniKitProvider>{children}</MiniKitProvider>;
}
