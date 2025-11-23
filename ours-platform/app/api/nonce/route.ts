import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  
  // Guardamos el nonce en una cookie segura para verificarlo después
  (await cookies()).set("siwe", nonce, { secure: true, httpOnly: true });

  return NextResponse.json({ nonce });
}