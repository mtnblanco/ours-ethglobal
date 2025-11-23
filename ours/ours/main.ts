import { cre, Runner, type Runtime } from "@chainlink/cre-sdk";
import { keccak256, toUtf8Bytes } from "ethers";
import contractAbiJson from "./abis/ChainlinkKYCIssuer.json";

//
// -------------------------
// TYPES
// -------------------------
type Config = {
  kycIssuerAddress: string;          // Contrato en Worldchain
  applicantIdLookupUrl?: string;     // Backend opcional
  lookupApiToken?: string;           // Token para el backend
  mockOnfidoApproved?: boolean;      // Mock para demo
};

interface KYCRequestedEvent {
  user: string;
  nullifierHash: string;
  timestamp: string;
}

interface ApplicantIdResponse {
  applicantId: string;
}

interface OnfidoCheckResponse {
  id: string;
  status: string;
  result: string; // clear o consider
  [key: string]: unknown;
}

//
// -------------------------
// HELPERS
// -------------------------
async function fetchApplicantId(
  runtime: Runtime<Config>,
  user: string
): Promise<string> {
  const config = runtime.getConfig();

  // Sin backend → mock
  if (!config.applicantIdLookupUrl || !config.lookupApiToken) {
    const mockId = `mock-${user.slice(0, 8)}-${Date.now()}`;
    runtime.log(`[MOCK] Applicant ID generado: ${mockId}`);
    return mockId;
  }

  runtime.log(`Buscando applicantId en backend para usuario: ${user}`);

  const http = new cre.capabilities.HTTPClient();
  const request = {
    url: `${config.applicantIdLookupUrl}/${user}`,
    method: "GET",
    headers: {
      "Authorization": `Bearer ${config.lookupApiToken}`,
      "Content-Type": "application/json",
    },
  };

  const response = await http.sendRequest(runtime, request).result();

  if (response.statusCode !== 200) {
    throw new Error(
      `Backend devolvió ${response.statusCode}: ${response.body}`
    );
  }

  const parsed: ApplicantIdResponse = JSON.parse(response.body);
  if (!parsed.applicantId) {
    throw new Error(`El backend no devolvió applicantId para ${user}`);
  }

  runtime.log(`Applicant ID encontrado: ${parsed.applicantId}`);
  return parsed.applicantId;
}

function mockOnfidoCheck(
  runtime: Runtime<Config>,
  applicantId: string
): OnfidoCheckResponse {
  const config = runtime.getConfig();

  const approved =
    config.mockOnfidoApproved !== undefined
      ? config.mockOnfidoApproved
      : true;

  runtime.log(
    `[MOCK] Onfido result: ${approved ? "APPROVED" : "REJECTED"}`
  );

  return {
    id: applicantId,
    status: "complete",
    type: "express",
    result: approved ? "clear" : "consider",
    created_at: new Date().toISOString(),
    document_ids: ["doc-1"],
    report_ids: approved ? ["report-1"] : [],
  };
}

function hashCheckResult(check: OnfidoCheckResponse): string {
  const json = JSON.stringify(check);
  return keccak256(toUtf8Bytes(json));
}

//
// -------------------------
// MAIN HANDLER
// -------------------------
const onKYCRequested = async (
  runtime: Runtime<Config>,
  event: KYCRequestedEvent
) => {
  const { user, nullifierHash } = event;

  runtime.log(`\n--- Nueva solicitud KYC para ${user} ---`);
  runtime.log(`NullifierHash: ${nullifierHash}`);

  // 1. Obtener Applicant ID (real o mock)
  const applicantId = await fetchApplicantId(runtime, user);

  // 2. Mock del resultado Onfido
  const check = mockOnfidoCheck(runtime, applicantId);

  // Determinación de aprovado/rechazado
  const approved = check.result === "clear";

  runtime.log(`Aprobado: ${approved}`);

  // 3. Hashear resultado
  const hash = hashCheckResult(check);
  runtime.log(`Hash del KYC: ${hash}`);

  // 4. Enviar fulfillKYC() a tu contrato
  const config = runtime.getConfig();
  const contractAbi = contractAbiJson.abi;

  const worldchainSelector = 5299555114858065850n;

  const evm = new cre.capabilities.EVMClient(worldchainSelector);

  const tx = await evm
    .callContract(runtime, {
      to: config.kycIssuerAddress,
      abi: contractAbi,
      function: "fulfillKYC",
      args: [user, approved, hash],
    })
    .result();

  runtime.log(`Tx enviada → ${tx.transactionHash}`);
  runtime.log(`KYC completado para ${user}`);

  return {
    user,
    approved,
    hash,
    tx: tx.transactionHash,
  };
};

//
// -------------------------
// TRIGGER + RUNNER
// -------------------------
const initWorkflow = async (config: Config) => {
  const worldchainSelector = 5299555114858065850n;
  const evm = new cre.capabilities.EVMClient(worldchainSelector);
  const contractAbi = contractAbiJson.abi;

  return [
    cre.handler(
      evm.logTrigger({
        contractAddress: config.kycIssuerAddress,
        abi: contractAbi,
        eventName: "KYCRequested",
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
