import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Generamos un UUID simple y removemos los guiones para que sea compatible
    const uuid = crypto.randomUUID().replace(/-/g, '');

    // --------------------------------------------------------------------------
    // TODO: GUARDAR EN TU BASE DE DATOS
    // Aquí deberías crear un registro en tu DB, por ejemplo:
    // await db.orders.create({ 
    //   referenceId: uuid, 
    //   status: 'PENDING', 
    //   amount: ..., 
    //   userId: ... 
    // });
    // --------------------------------------------------------------------------

    console.log("✅ Payment initiated, reference generated:", uuid);

    return NextResponse.json({ id: uuid });
    
  } catch (error) {
    console.error("Error initiating payment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}