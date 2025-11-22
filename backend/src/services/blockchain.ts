import { ethers } from 'ethers';
import { SmartContractResponse } from '../types';

// ABI del contrato ChainlinkKYCIssuer - Updated to match real contract
const KYC_ISSUER_ABI = [
  // Main KYC function
  "function verifyAndRequestKYC(address user, uint256 root, uint256 nullifierHash, uint256[8] calldata proof) external",
  
  // View functions
  "function getKYCStatus(address user) external view returns (uint8 status, uint256 kycId, uint256 timestamp)",
  "function isKYCApproved(address user) external view returns (bool approved)",
  "function getKYCData(address user) external view returns (tuple(uint8 status, uint256 kycId, uint256 timestamp, bytes32 requestId, string rejectionReason) data)",
  
  // Admin functions
  "function setSubscriptionId(uint64 _subscriptionId) external",
  "function setKYCSourceCode(string calldata _sourceCode) external",
  "function manualKYCApproval(address user) external",
  
  // Owner function
  "function owner() external view returns (address)",
  
  // Counters and mappings
  "function kycIdCounter() external view returns (uint256)",
  "function kycData(address) external view returns (uint8 status, uint256 kycId, uint256 timestamp, bytes32 requestId, string rejectionReason)",
  
  // Events
  "event KYCRequested(address indexed user, uint256 indexed kycId, uint256 nullifierHash)",
  "event KYCStatusUpdated(address indexed user, uint256 indexed kycId, uint8 status)",
  "event ChainlinkKYCRequested(address indexed user, bytes32 indexed requestId)",
  "event ChainlinkKYCCompleted(address indexed user, bytes32 indexed requestId, uint8 status)"
];

interface KYCSubmissionData {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  user_address: string;
}

export class BlockchainService {
  private provider: ethers.Provider;
  private wallet: ethers.Wallet;
  private contractAddress: string;

  constructor() {
    const rpcUrl = process.env.WORLD_CHAIN_RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;
    this.contractAddress = process.env.CHAINLINK_KYC_ISSUER_CONTRACT_ADDRESS || '';

    if (!rpcUrl || !privateKey || !this.contractAddress) {
      throw new Error('Missing blockchain configuration');
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
  }

  async submitKYCToContract(data: KYCSubmissionData): Promise<SmartContractResponse> {
    try {
      // Create contract instance
      const contract = new ethers.Contract(
        this.contractAddress,
        KYC_ISSUER_ABI,
        this.wallet
      );

      // Parse the proof array (assuming it's a JSON string with 8 elements)
      let proofArray: bigint[];
      try {
        const proofParsed = JSON.parse(data.proof);
        proofArray = proofParsed.map((p: string) => BigInt(p));
        
        if (proofArray.length !== 8) {
          throw new Error('Proof must contain exactly 8 elements');
        }
      } catch (parseError) {
        return {
          success: false,
          error: 'Invalid proof format'
        };
      }

      // Convert other parameters
      const root = BigInt(data.merkle_root);
      const nullifierHash = BigInt(data.nullifier_hash);
      const userAddress = data.user_address;

      // Estimate gas
      const gasEstimate = await contract.verifyAndRequestKYC.estimateGas(
        userAddress,
        root,
        nullifierHash,
        proofArray
      );

      // Execute transaction with 20% gas buffer
      const tx = await contract.verifyAndRequestKYC(
        userAddress,
        root,
        nullifierHash,
        proofArray,
        {
          gasLimit: gasEstimate * BigInt(120) / BigInt(100)
        }
      );

      // Wait for confirmation
      const receipt = await tx.wait();

      // Parse events to get KYC ID
      let kycId: string | undefined;
      if (receipt.logs) {
        for (const log of receipt.logs) {
          try {
            const parsedLog = contract.interface.parseLog({
              topics: log.topics,
              data: log.data
            });
            if (parsedLog && parsedLog.name === 'KYCRequested') {
              kycId = parsedLog.args[1].toString();
              break;
            }
          } catch (logError) {
            // Continue to next log if parsing fails
          }
        }
      }

      return {
        success: true,
        transaction_hash: receipt.hash,
        kyc_id: kycId
      };

    } catch (error) {
      console.error('Smart contract interaction error:', error);
      return {
        success: false,
        error: 'Failed to submit KYC to smart contract'
      };
    }
  }

  async getKYCStatus(userAddress: string): Promise<{ pending: boolean; kycId?: string; status?: string }> {
    try {
      const contract = new ethers.Contract(
        this.contractAddress,
        KYC_ISSUER_ABI,
        this.provider
      );

      // Use the new getKYCStatus function that returns (status, kycId, timestamp)
      const [status, kycId, timestamp] = await contract.getKYCStatus(userAddress);
      
      // KYC Status enum: 0=None, 1=WorldIdVerified, 2=Pending, 3=Approved, 4=Rejected, 5=Expired
      const statusMap = {
        0: 'None',
        1: 'WorldIdVerified', 
        2: 'Pending',
        3: 'Approved',
        4: 'Rejected',
        5: 'Expired'
      };

      const statusNumber = parseInt(status.toString());
      const isPending = statusNumber === 1 || statusNumber === 2; // WorldIdVerified or Pending
      
      return {
        pending: isPending,
        kycId: kycId.toString() !== '0' ? kycId.toString() : undefined,
        status: statusMap[statusNumber as keyof typeof statusMap] || 'Unknown'
      };
    } catch (error) {
      console.error('Error getting KYC status:', error);
      return { pending: false };
    }
  }
}