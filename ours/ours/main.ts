import { cre, Runner, type Runtime } from "@chainlink/cre-sdk";
import { keccak256, toUtf8Bytes } from "ethers";

// Tipo para la configuración del workflow
type Config = {
  kycIssuerAddress: string;
  // Mockeado: onfidoApiToken ya no se usa
  applicantIdLookupUrl?: string; // Opcional, si quieres mockear también el backend
  lookupApiToken?: string; // Opcional
  mockOnfidoApproved?: boolean; // Flag para mockear aprobado/rechazado
};

// Tipo para el payload del evento KYCRequested
interface KYCRequestedEvent {
  user: string;
  nullifierHash: string;
  timestamp: string;
}

// Tipo para la respuesta del backend (applicant ID)
interface ApplicantIdResponse {
  applicantId: string;
}

// Tipo para la respuesta de Onfido Check
interface OnfidoCheckResponse {
  id: string;
  status: string;
  result: string; // "clear" o "consider"
  [key: string]: unknown;
}

// Handler principal del workflow
const onKYCRequested = async (runtime: Runtime<Config>, event: KYCRequestedEvent) => {
  const { user, nullifierHash, timestamp } = event;
  const config = runtime.getConfig();
  
  runtime.log(`Processing KYC request for user: ${user}, nullifierHash: ${nullifierHash}`);
  
  // Paso 1: Obtener applicant ID (mockeado o desde backend)
  let applicantId: string;
  
  if (config.applicantIdLookupUrl && config.lookupApiToken) {
    // Opción real: obtener desde backend
    runtime.log(`Fetching applicant ID from backend...`);
    const applicantIdUrl = `${config.applicantIdLookupUrl}/${user}`;
    
    const httpClient = new cre.capabilities.HTTPClient();
    const applicantIdRequest = {
      url: applicantIdUrl,
      method: "GET",
      headers: {
        "Authorization": `Bearer ${config.lookupApiToken}`,
        "Content-Type": "application/json"
      }
    };
    
    const applicantIdResponse = httpClient.sendRequest(runtime, applicantIdRequest);
    const applicantIdResult = await applicantIdResponse.result();
    
    if (applicantIdResult.statusCode !== 200) {
      throw new Error(`Failed to fetch applicant ID: ${applicantIdResult.statusCode}`);
    }
    
    const applicantData: ApplicantIdResponse = JSON.parse(applicantIdResult.body);
    applicantId = applicantData.applicantId;
    
    if (!applicantId) {
      throw new Error(`No applicant ID found for user: ${user}`);
    }
    
    runtime.log(`Found applicant ID: ${applicantId}`);
  } else {
    // Mock: generar un applicant ID ficticio
    applicantId = `mock-applicant-${user.slice(0, 10)}-${Date.now()}`;
    runtime.log(`Using mock applicant ID: ${applicantId}`);
  }
  
  // Paso 2: Mockear respuesta de Onfido Check
  runtime.log(`[MOCK] Checking Onfido status for applicant: ${applicantId}`);
  
  // Determinar si está aprobado (por defecto aprobado, o usar flag de config)
  const approved = config.mockOnfidoApproved !== undefined 
    ? config.mockOnfidoApproved 
    : true; // Por defecto aprobado para la demo
  
  // Crear respuesta mock realista de Onfido
  const onfidoCheck: OnfidoCheckResponse = {
    id: applicantId,
    status: "complete",
    result: approved ? "clear" : "consider",
    type: "express",
    created_at: new Date().toISOString(),
    result_url: `https://dashboard.onfido.com/checks/${applicantId}`,
    href: `/v3/checks/${applicantId}`,
    download_uri: `/v3/checks/${applicantId}/download`,
    form_uri: null,
    redirect_uri: null,
    results_uri: null,
    report_ids: approved ? ["report-1", "report-2"] : [],
    document_ids: ["doc-1"],
    privacy_notices_read_consent_given: true
  };
  
  runtime.log(`[MOCK] Onfido check result: ${onfidoCheck.result} (${approved ? "APPROVED" : "REJECTED"})`);
  
  // Paso 3: Calcular hash del resultado (Keccak256)
  const checkDataString = JSON.stringify(onfidoCheck);
  const hash = keccak256(toUtf8Bytes(checkDataString));
  
  runtime.log(`Calculated hash: ${hash}`);
  
  // Paso 4: Determinar si está aprobado (result === "clear")
  const approved = onfidoCheck.result === "clear";
  runtime.log(`KYC approved: ${approved}`);
  
  // Paso 5: Llamar fulfillKYC() en el contrato
  runtime.log(`Calling fulfillKYC on contract: ${config.kycIssuerAddress}`);
  
  // Leer el ABI del contrato para poder usarlo
  const abiPath = "./abis/ChainlinkKYCIssuer.json";
  const abiFile = await Bun.file(abiPath).json();
  const contractAbi = abiFile.abi;
  
  // Llamar la función fulfillKYC usando EVMClient
  const evmClient = new cre.capabilities.EVMClient("worldchain-sepolia");
  
  const callContractRequest = {
    to: config.kycIssuerAddress,
    abi: contractAbi,
    function: "fulfillKYC",
    args: [user, approved, hash]
  };
  
  const txResponse = evmClient.callContract(runtime, callContractRequest);
  const txResult = await txResponse.result();
  
  runtime.log(`Transaction sent: ${txResult.transactionHash}`);
  runtime.log(`KYC fulfillment completed for user: ${user}`);
  
  return {
    user,
    approved,
    hash,
    transactionHash: txResult.transactionHash
  };
};

// Inicializar el workflow
const initWorkflow = async (config: Config) => {
  // Crear el trigger para el evento EVM KYCRequested
  const evmClient = new cre.capabilities.EVMClient("worldchain-sepolia");
  
  // Cargar el ABI del contrato para el trigger
  const abiPath = "./abis/ChainlinkKYCIssuer.json";
  const abiFile = await Bun.file(abiPath).json();
  const contractAbi = abiFile.abi;
  
  // Crear el trigger para escuchar el evento KYCRequested
  return [
    cre.handler(
      evmClient.logTrigger({
        contractAddress: config.kycIssuerAddress,
        abi: contractAbi,
        eventName: "KYCRequested",
        // El SDK mapea automáticamente los parámetros del evento (user, nullifierHash, timestamp)
      }),
      onKYCRequested
    ),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}

main();
