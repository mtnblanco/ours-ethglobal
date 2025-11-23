import { cre, Runner, type Runtime, ConsensusAggregationByFields, identical, ok, json, type HTTPSendRequester, getNetwork, type EVMLog, bytesToHex, prepareReportRequest, hexToBase64 } from "@chainlink/cre-sdk";
import { keccak256, toHex, encodeFunctionData } from "viem";
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

  // El body debe estar en base64 para Chainlink CRE
  const bodyJson = JSON.stringify({
    email: `${userAddress.slice(0, 8)}@user.com`,
    user_address: userAddress,
  });
  const bodyBase64 = Buffer.from(bodyJson).toString('base64');

  const response = sendRequester.sendRequest({
    url: apiUrl,
    method: "POST",
    headers,
    body: bodyBase64,
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
  const hashBytes = keccak256(toHex(jsonStr));
  return hashBytes;
}

//
// -------------------------
// MAIN HANDLER
// -------------------------
const onKYCRequested = async (
  runtime: Runtime<Config>,
  log: EVMLog
) => {
  // Extraer topics del evento
  const topics = log.topics;
  
  // Validar que hay suficientes topics
  // KYCRequested(address indexed user, bytes32 indexed nullifierHash, uint256 timestamp)
  // Topic 0: Event signature
  // Topic 1: indexed user (address)
  // Topic 2: indexed nullifierHash (bytes32)
  if (topics.length < 3) {
    runtime.log(`ERROR: Log missing required topics for KYCRequested event. Found ${topics.length} topics.`);
    throw new Error("Insufficient topics");
  }
  
  // Decodificar argumentos indexed
  // Para address, hacer slice de los últimos 20 bytes del topic de 32 bytes
  const user = bytesToHex(topics[1].slice(12)); // Address está en los últimos 20 bytes
  const nullifierHash = bytesToHex(topics[2]); // bytes32 está completo en el topic
  
  // El timestamp (uint256) está en log.data (no indexed)
  // Por simplicidad, usamos el timestamp actual ya que no es crítico para el flujo
  const timestamp = BigInt(Math.floor(Date.now() / 1000));
  
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

    // Obtener network para el EVMClient
    const network = getNetwork({
      chainFamily: "evm",
      chainSelectorName: "ethereum-testnet-sepolia",
      isTestnet: true,
    });

    if (!network) {
      throw new Error("Network not found: ethereum-testnet-sepolia");
    }

    const evmClient = new cre.capabilities.EVMClient(network.chainSelector.selector);

    runtime.log(`Llamando fulfillKYC en contrato ${config.kycIssuerAddress}`);
    runtime.log(`Parámetros: user=${user}, approved=${approved}, hash=${hash}`);

    // Paso 1: Codificar los datos de la función fulfillKYC
    runtime.log(`📝 Paso 1: Codificando datos de la función fulfillKYC...`);
    const callData = encodeFunctionData({
      abi: contractAbi,
      functionName: "fulfillKYC",
      args: [user, approved, hash],
    });

    // Paso 2: Generar un reporte firmado usando runtime.report()
    // prepareReportRequest() configura automáticamente encoderName, signingAlgo, hashingAlgo
    runtime.log(`📝 Paso 2: Generando reporte firmado...`);
    const reportResponse = runtime.report(prepareReportRequest(callData)).result();

    // Paso 3: Enviar el reporte a la blockchain usando evmClient.writeReport()
    // writeReport() usa automáticamente CRE_ETH_PRIVATE_KEY del .env para firmar
    runtime.log(`📝 Paso 3: Enviando reporte a la blockchain...`);
    runtime.log(`📝 El workflow usará automáticamente CRE_ETH_PRIVATE_KEY del .env`);
    
    const writeResult = await evmClient.writeReport(runtime, {
      receiver: config.kycIssuerAddress, // Dirección del contrato destino
      report: reportResponse, // Reporte firmado generado en el paso 2
      gasConfig: {
        gasLimit: "500000", // Límite de gas para la transacción
      },
    }).result();

    // Log del resultado
    const txHash = writeResult.txHash ? bytesToHex(writeResult.txHash) : "N/A";
    runtime.log(`✅ Transacción enviada → Hash: ${txHash}`);
    
    if (txHash !== "N/A") {
      runtime.log(`🔗 Ver transacción en Etherscan: https://sepolia.etherscan.io/tx/${txHash}`);
    }
    
    runtime.log(`🎉 KYC completado para ${user}`);

  return {
    user,
    approved,
    hash,
    txHash,
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
  // Obtener network usando getNetwork
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: "ethereum-testnet-sepolia", // Sepolia para testing
    isTestnet: true,
  });

  if (!network) {
    throw new Error(`Network not found: ethereum-testnet-sepolia`);
  }

  // Crear EVMClient con el chainSelector
  const evmClient = new cre.capabilities.EVMClient(network.chainSelector.selector);

  // Calcular el hash del event signature
  // KYCRequested(address indexed user, bytes32 indexed nullifierHash, uint256 timestamp)
  const kycRequestedEventHash = keccak256(toHex("KYCRequested(address,bytes32,uint256)"));

  return [
    cre.handler(
      evmClient.logTrigger({
        addresses: [config.kycIssuerAddress],
        topics: [
          { values: [kycRequestedEventHash] }, // Topic 0: Event signature
          { values: [] }, // Topic 1: Wildcard para user address (indexed)
          { values: [] }, // Topic 2: Wildcard para nullifierHash (indexed)
        ],
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
