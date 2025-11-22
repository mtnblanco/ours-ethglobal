# Ours Backend API

Backend server for the Ours Real Estate Platform with World ID integration and smart contract connectivity.

## 🚀 Features

- **World ID Verification**: Integration with Worldcoin's World ID system
- **Smart Contract Integration**: Direct connection with ChainlinkKYCIssuer.sol on World Chain
- **Express.js Server**: RESTful API with TypeScript
- **Error Handling**: Comprehensive error handling and validation
- **CORS Support**: Configured for frontend integration

## 📁 Project Structure

```
backend/
├── src/
│   ├── index.ts              # Main server file
│   ├── routes/
│   │   └── kyc.ts           # KYC related endpoints
│   ├── services/
│   │   ├── worldId.ts       # World ID verification service
│   │   └── blockchain.ts    # Smart contract interaction service
│   ├── middleware/
│   │   └── errorHandler.ts  # Error handling middleware
│   └── types/
│       └── index.ts         # TypeScript type definitions
├── package.json
├── tsconfig.json
└── .env.example
```

## 🔧 Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=8000
NODE_ENV=development

WORLDCOIN_API_KEY=your_worldcoin_api_key_here
WORLDCOIN_APP_ID=your_worldcoin_app_id_here

WORLD_CHAIN_RPC_URL=https://worldchain-mainnet.gateway.tenderly.co
PRIVATE_KEY=your_private_key_here

CHAINLINK_KYC_ISSUER_CONTRACT_ADDRESS=your_deployed_contract_address_here

FRONTEND_URL=http://localhost:3000
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
npm start
```

## 📡 API Endpoints

### Health Check
- **GET** `/health`
- Returns server status and version

### KYC Endpoints

#### Verify World ID and Submit to Smart Contract
- **POST** `/api/v1/kyc/worldid`
- **Request Body:**
  ```json
  {
    "proof": "string",
    "merkle_root": "string", 
    "nullifier_hash": "string",
    "verification_level": "string",
    "action": "string",
    "signal": "string",
    "user_address": "string" // optional
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "KYC initiated successfully",
    "transaction_hash": "0x...",
    "kyc_id": "123"
  }
  ```

#### Get KYC Status
- **GET** `/api/v1/kyc/status/:address`
- **Response:**
  ```json
  {
    "success": true,
    "address": "0x...",
    "kyc_pending": true,
    "kyc_id": "123"
  }
  ```

## 🔗 Integration with Frontend

Update your frontend to point to this backend:

```typescript
// In your frontend code
const response = await fetch('http://localhost:8000/api/v1/kyc/worldid', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    proof: worldIdProof.proof,
    merkle_root: worldIdProof.merkle_root,
    nullifier_hash: worldIdProof.nullifier_hash,
    verification_level: worldIdProof.verification_level,
    action: "signup",
    signal: window.location.href,
    user_address: userAddress
  }),
});
```

## 🧪 Testing

### Test Health Endpoint
```bash
curl http://localhost:8000/health
```

### Test KYC Status
```bash
curl http://localhost:8000/api/v1/kyc/status/0x1234567890123456789012345678901234567890
```

## 🚨 Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "path": "/api/v1/kyc/worldid" // in 404 errors
}
```

## 📝 Development Notes

- Server runs on port 8000 by default
- CORS configured for `http://localhost:3000` (frontend)
- All routes require proper JSON content-type headers
- Request validation using Joi schema validation
- Automatic TypeScript compilation with `tsx` in development

## 🔐 Security

- Helmet.js for security headers
- CORS protection
- Request validation
- Environment variable protection
- Error message sanitization in production
