import { NextRequest, NextResponse } from 'next/server';
// Asegúrate de tener los tipos instalados o defínelos manualmente si usas JS puro
import { MiniAppPaymentSuccessPayload } from '@worldcoin/minikit-js';

interface IRequestPayload {
  payload: MiniAppPaymentSuccessPayload;
}

export async function POST(req: NextRequest) {
  try {
    const { payload } = (await req.json()) as IRequestPayload;

    // 1. Validación básica de entrada
    if (!payload || !payload.reference || !payload.transaction_id) {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    // --------------------------------------------------------------------------
    // TODO: VERIFICAR TU BASE DE DATOS
    // 1. Busca la orden con payload.reference en tu DB.
    // 2. Si no existe o ya está pagada, devuelve error.
    // const order = await db.orders.find({ referenceId: payload.reference });
    // if (!order) throw new Error("Order not found");
    // --------------------------------------------------------------------------

    console.log("🔍 Verifying transaction with Worldcoin API...", payload.transaction_id);

    // 2. Consultar la API de Worldcoin para verificar el estado real
    const verifyRes = await fetch(
      `https://developer.worldcoin.org/api/v2/minikit/transaction/${payload.transaction_id}?app_id=${process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID}`,
      {
        method: 'GET',
        headers: {
          // Esta API Key se obtiene en el Developer Portal
          'Authorization': `Bearer ${process.env.WORLDCOIN_DEV_PORTAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!verifyRes.ok) {
      const errorText = await verifyRes.text();
      console.error("Worldcoin API Error:", errorText);
      return NextResponse.json({ success: false, error: "Failed to verify with provider" }, { status: 500 });
    }

    const transaction = await verifyRes.json();

    // 3. Validar que la referencia coincida y el estado sea válido
    // Los estados pueden ser 'mined' (confirmado) o 'pending' (en proceso pero válido). 
    // Si es 'failed', rechazamos.
    if (
        transaction.reference === payload.reference && 
        transaction.status !== 'failed'
    ) {
        
        // ----------------------------------------------------------------------
        // TODO: ACTUALIZAR TU BASE DE DATOS
        // await db.orders.update({ 
        //   where: { referenceId: payload.reference }, 
        //   data: { status: 'COMPLETED', txHash: transaction.transactionHash } 
        // });
        // ----------------------------------------------------------------------

        console.log("✅ Payment verified successfully!");
        return NextResponse.json({ success: true });
    } else {
        console.warn("❌ Payment verification failed:", transaction);
        return NextResponse.json({ success: false, status: transaction.status });
    }

  } catch (error) {
    console.error("Error processing payment confirmation:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}