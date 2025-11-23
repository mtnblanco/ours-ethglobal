import { cre, Runner, type Runtime, ConsensusAggregationByFields, identical, ok, json, type HTTPSendRequester } from "@chainlink/cre-sdk";
import { keccak256, toUtf8Bytes } from "ethers";
import contractAbiJson from "./abis/ChainlinkKYCIssuer.json";

//
// -------------------------
// TYPES
// -------------------------
type Config = {
  kycIssuerAddress: string;          // Contrato en Worldchain
  kycApiUrl: string;                 // URL de tu API de KYC
  kycApiToken?: string;              // Token para autenticación (opcional)
  useMock?: boolean;                 // Para testing sin API
  mockOnfidoApproved?: boolean;      // Mock para demo
};

interface KYCRequestedEvent {
  user: string;
  nullifierHash: string;
  timestamp: bigint;
}

interface KYCApiResponse {
  isverified: boolean;
  user: {
    id: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
    dob: string | null;
    address: string | null;
    user_address: string | null;
  };
}

//
// -------------------------
// HELPERS
// -------------------------

// Función de fetch que será usada por el HTTPClient
const fetchKYCVerification = (
  sendRequester: HTTPSendRequester,
  apiUrl: string,
  userAddress: string,
  authToken?: string
) => {
  const headers: Record<string, string> = {
      "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const response = sendRequester.sendRequest({
    url: apiUrl,
    method: "POST",
    headers,
    body: JSON.stringify({
      email: `${userAddress.slice(0, 8)}@user.com`,
      user_address: userAddress,
    }),
  }).result();

  if (!ok(response)) {
    throw new Error(
      `API devolvió ${response.statusCode}: ${response.body}`
    );
  }

  // Usar json() para parsear como en la documentación
  const data = json(response) as { isverified: boolean; user: any };
  
  return {
    isverified: data.isverified,
    email: data.user?.email || "",
    user_address: data.user?.user_address || userAddress,
  };
};

interface SimplifiedKYCResponse {
  isverified: boolean;
  email: string;
  user_address: string;
}

async function verifyKYCWithAPI(
  runtime: Runtime<Config>,
  userAddress: string
): Promise<SimplifiedKYCResponse> {
  const config = runtime.config;

  // Modo mock para testing
  if (config.useMock) {
    const approved = config.mockOnfidoApproved !== undefined ? config.mockOnfidoApproved : true;
    runtime.log(`[MOCK] KYC verification: ${approved ? "APPROVED" : "REJECTED"}`);
  return {
      isverified: approved,
      email: `${userAddress.slice(0, 8)}@mock.com`,
      user_address: userAddress,
    };
  }

  runtime.log(`Verificando KYC con API para usuario: ${userAddress}`);

  // HTTPClient con ConsensusAggregationByFields como en la documentación
  const httpClient = new cre.capabilities.HTTPClient();

  const kycResult = await httpClient
    .sendRequest(
      runtime,
      fetchKYCVerification,
      ConsensusAggregationByFields({
        isverified: identical,       // Campo crítico: debe ser identical
        email: identical,             // Email debe ser identical
        user_address: identical,      // Address debe ser identical
      })
    )(config.kycApiUrl, userAddress, config.kycApiToken)
    .result();

  runtime.log(`KYC API Response: ${JSON.stringify(kycResult)}`);
  
  return kycResult;
}

function hashKYCResult(apiResponse: SimplifiedKYCResponse): string {
  // Crear un objeto consistente para hashear
  const dataToHash = {
    isverified: apiResponse.isverified,
    email: apiResponse.email,
    user_address: apiResponse.user_address,
    timestamp: Math.floor(Date.now() / 1000),
  };
  const jsonStr = JSON.stringify(dataToHash);
  const hashBytes = keccak256(toUtf8Bytes(jsonStr));
  return hashBytes;
}

//
// -------------------------
// MAIN HANDLER
// -------------------------
const onKYCRequested = async (
  runtime: Runtime<Config>,
  log: any
) => {
  // Extraer datos del evento
  const user = log.args[0] as string;
  const nullifierHash = log.args[1];
  const timestamp = log.args[2];

  runtime.log(`\n--- Nueva solicitud KYC para ${user} ---`);
  runtime.log(`NullifierHash: ${nullifierHash}`);
  runtime.log(`Timestamp: ${timestamp}`);

  try {
    // 1. Verificar KYC con tu API (o mock)
    const kycResult = await verifyKYCWithAPI(runtime, user);

    // 2. Determinar aprobación
    const approved = kycResult.isverified;
    runtime.log(`KYC ${approved ? "APROBADO" : "RECHAZADO"} para ${user}`);

  // 3. Hashear resultado
    const hash = hashKYCResult(kycResult);
  runtime.log(`Hash del KYC: ${hash}`);

  // 4. Enviar fulfillKYC() a tu contrato
    const config = runtime.config;
  const contractAbi = contractAbiJson.abi;

    const worldchainSelector = 16015286601757825753n;  // Sepolia para testing
  const evm = new cre.capabilities.EVMClient(worldchainSelector);

    runtime.log(`Llamando fulfillKYC en contrato ${config.kycIssuerAddress}`);
    runtime.log(`Parámetros: user=${user}, approved=${approved}, hash=${hash}`);

    // Enviar transacción al contrato
    const callParams: any = {
      address: config.kycIssuerAddress,
      abi: contractAbi,
      function: "fulfillKYC",
      args: [user, approved, hash],
    };

    const tx = await evm.callContract(runtime as any, callParams).result();

    runtime.log(`Tx enviada → ${JSON.stringify(tx)}`);
  runtime.log(`KYC completado para ${user}`);

  return {
    user,
    approved,
    hash,
      tx,
      kycData: kycResult,
  };
  } catch (error) {
    runtime.log(`ERROR en KYC para ${user}: ${error}`);
    throw error;
  }
};

//
// -------------------------
// TRIGGER + RUNNER
// -------------------------
const initWorkflow = async (config: Config) => {
  const worldchainSelector = 16015286601757825753n;  // Sepolia para testing
  const evm = new cre.capabilities.EVMClient(worldchainSelector);
  const contractAbi = contractAbiJson.abi;

  const triggerConfig: any = {
    addresses: [config.kycIssuerAddress],
  };

  return [
    cre.handler(
      evm.logTrigger(triggerConfig),
      onKYCRequested
    ),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}

main();
