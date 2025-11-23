import { ethers } from 'ethers';
import { SmartContractResponse } from '../types';

// ABI del contrato ChainlinkKYCIssuer - Updated to match deployed contract
const KYC_ISSUER_ABI = [
  // Main functions
  "function requestKYCWithWorldID(uint256 signal, uint256 root, uint256 nullifierHash, uint256[8] calldata proof) external",
  "function fulfillKYC(address user, bool approved, bytes32 kycDataHash) external",
  
  // View functions
  "function getKYCData(address user) external view returns (tuple(uint8 status, bytes32 nullifierHash, uint256 requestedAt, uint256 approvedAt, bytes32 kycDataHash, address onchainIDAddress) kycData)",
  "function isKYCVerified(address user) external view returns (bool)",
  "function kycData(address) external view returns (uint8 status, bytes32 nullifierHash, uint256 requestedAt, uint256 approvedAt, bytes32 kycDataHash, address onchainIDAddress)",
  "function usedNullifiers(bytes32 nullifierHash) external view returns (bool)",
  "function totalKYCsApproved() external view returns (uint256)",
  
  // Role functions
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "function grantRole(bytes32 role, address account) external",
  "function CHAINLINK_DON_ROLE() external view returns (bytes32)",
  
  // Events
  "event KYCRequested(address indexed user, bytes32 indexed nullifierHash, uint256 timestamp)",
  "event KYCFulfilled(address indexed user, bool approved, bytes32 kycDataHash)"
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
        // Check if we're using mock data
        if (data.proof === 'mock_proof_for_demo') {
          console.log('🎭 Using mock proof array for demo');
          proofArray = Array(8).fill(BigInt(0));
        } else {
          const proofParsed = JSON.parse(data.proof);
          proofArray = proofParsed.map((p: string) => BigInt(p));
          
          if (proofArray.length !== 8) {
            throw new Error('Proof must contain exactly 8 elements');
          }
        }
      } catch (parseError) {
        // For demo purposes, use mock proof if parsing fails
        console.warn('Using mock proof for demo:', parseError);
        proofArray = Array(8).fill(BigInt(0));
      }

      // Convert other parameters
      const signal = BigInt(1); // Mock signal for demo
      
      // Handle merkle_root - convert mock data to valid BigInt
      let root: bigint;
      if (data.merkle_root === 'mock_merkle_root' || !data.merkle_root) {
        console.log('🎭 Using mock merkle root for demo');
        root = BigInt(Math.floor(Math.random() * 1000000));
      } else {
        try {
          root = BigInt(data.merkle_root);
        } catch (error) {
          console.warn('Invalid merkle_root format, using random value:', error);
          root = BigInt(Math.floor(Math.random() * 1000000));
        }
      }
      
      // Handle nullifier_hash - convert mock data to valid BigInt
      let nullifierHash: bigint;
      if (data.nullifier_hash === 'mock_nullifier_hash' || 
          data.nullifier_hash === 'demo_nullifier_hash' || 
          !data.nullifier_hash) {
        console.log('🎭 Using mock nullifier hash for demo');
        nullifierHash = BigInt(Math.floor(Math.random() * 1000000));
      } else {
        try {
          // Try to convert hex string to BigInt
          nullifierHash = BigInt(data.nullifier_hash);
        } catch (error) {
          console.warn('Invalid nullifier_hash format, using random value:', error);
          nullifierHash = BigInt(Math.floor(Math.random() * 1000000));
        }
      }

      // Estimate gas
      const gasEstimate = await contract.requestKYCWithWorldID.estimateGas(
        signal,
        root,
        nullifierHash,
        proofArray
      );

      // Execute transaction with 20% gas buffer
      const tx = await contract.requestKYCWithWorldID(
        signal,
        root,
        nullifierHash,
        proofArray,
        {
          gasLimit: (gasEstimate * BigInt(120)) / BigInt(100)
        }
      );

      const receipt = await tx.wait();

      console.log('✅ KYC transaction successful:', {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      });

      return {
        success: true,
        transaction_hash: receipt.hash,
        kyc_id: nullifierHash.toString() // Use nullifier hash as KYC ID for tracking
      };

    } catch (error: any) {
      console.error('❌ Blockchain transaction failed:', error);
      
      return {
        success: false,
        error: error.message || 'Transaction failed'
      };
    }
  }

  async fulfillKYC(userAddress: string, approved: boolean, kycDataHash: string): Promise<SmartContractResponse> {
    try {
      console.log('🔗 Calling fulfillKYC on smart contract:', {
        userAddress,
        approved,
        kycDataHash: kycDataHash.substring(0, 20) + '...'
      });

      const contract = new ethers.Contract(
        this.contractAddress,
        KYC_ISSUER_ABI,
        this.wallet
      );

      // Convert kycDataHash to bytes32
      const kycDataBytes32 = ethers.id(kycDataHash); // keccak256 hash

      // Estimate gas
      const gasEstimate = await contract.fulfillKYC.estimateGas(
        userAddress,
        approved,
        kycDataBytes32
      );

      // Execute transaction with 20% gas buffer
      const tx = await contract.fulfillKYC(
        userAddress,
        approved,
        kycDataBytes32,
        {
          gasLimit: (gasEstimate * BigInt(120)) / BigInt(100)
        }
      );

      const receipt = await tx.wait();

      console.log('✅ fulfillKYC transaction successful:', {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      });

      return {
        success: true,
        transaction_hash: receipt.hash
      };

    } catch (error: any) {
      console.error('❌ fulfillKYC transaction failed:', error);
      
      return {
        success: false,
        error: error.message || 'fulfillKYC transaction failed'
      };
    }
  }

  async getKYCStatus(userAddress: string): Promise<{ pending: boolean; kycId?: string; status?: string; nullifier_hash?: string; requested_at?: number; approved_at?: number; kyc_data_hash?: string; onchain_id_address?: string }> {
    try {
      console.log('🔗 Connecting to contract at:', this.contractAddress);
      console.log('🔗 Using provider for blockchain calls');
      
      const contract = new ethers.Contract(
        this.contractAddress,
        KYC_ISSUER_ABI,
        this.provider
      );

      console.log('📞 Calling contract.getKYCData for address:', userAddress);
      
      // Use getKYCData to get full KYC information
      const kycData = await contract.getKYCData(userAddress);
      console.log('📋 Raw contract response:', kycData);
      
      // KYC Status enum: 0=NONE, 1=WORLD_ID_VERIFIED, 2=PENDING_OFFCHAIN, 3=FULL_KYC, 4=REJECTED
      const statusMap = {
        0: 'NONE',
        1: 'WORLD_ID_VERIFIED', 
        2: 'PENDING_OFFCHAIN',
        3: 'FULL_KYC',
        4: 'REJECTED'
      };

      const statusNumber = parseInt(kycData.status.toString());
      const status = statusMap[statusNumber as keyof typeof statusMap] || 'UNKNOWN';
      const pending = statusNumber === 1 || statusNumber === 2; // WORLD_ID_VERIFIED or PENDING_OFFCHAIN

      const result = {
        pending,
        status,
        nullifier_hash: kycData.nullifierHash.toString(),
        requested_at: parseInt(kycData.requestedAt.toString()),
        approved_at: parseInt(kycData.approvedAt.toString()),
        kyc_data_hash: kycData.kycDataHash.toString(),
        onchain_id_address: kycData.onchainIDAddress
      };
      
      console.log('✅ Processed KYC status:', result);
      return result;

    } catch (error: any) {
      console.error('❌ Error getting KYC status:', error);
      
      return {
        pending: false,
        status: 'ERROR'
      };
    }
  }
}
