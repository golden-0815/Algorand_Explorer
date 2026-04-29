# ASA Stats API Usage Guide

## Overview

The ASA Stats API provides comprehensive data about Algorand accounts, including their ASA (Algorand Standard Asset) holdings, NFT collections, and portfolio valuations. This guide covers how to authenticate and use the API effectively.

## Base URL
```
https://www.asastats.com
```

## Authentication

The ASA Stats API uses JWT (JSON Web Token) authentication. You'll need to obtain access tokens to make API calls.

### Token Types
- **Access Token**: Used for API requests (short-lived)
- **Refresh Token**: Used to obtain new access tokens (longer-lived)

### Example Tokens
```
Access Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzgzOTc1Mzk1LCJpYXQiOjE3NTI0MzkzOTUsImp0aSI6Ijk0ZGU1MDRmMTJjNzQ2YmQ5NjJiMjk1ZTYzYzQ3YjE4IiwidXNlcl9pZCI6MjB9.dG0_zUVNd0bRuVrTOwlVOCXYM1dpkN848z4npZMAGFU

Refresh Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTgxNTUxMTM5NSwiaWF0IjoxNzUyNDM5Mzk1LCJqdGkiOiI5MDllNjU5ZjQ0YzI0ZDM1YmY2NzMyNWJhOGEwYjM0NCIsInVzZXJfaWQiOjIwfQ.eoX7Saj3fDqb7-zC1vMu95Boanfay2bFVXTt-moyX8g
```

This documentation provides a comprehensive guide for using the ASA Stats API, including authentication, endpoints, data structures, and best practices. The guide is structured to be both beginner-friendly and detailed enough for advanced users.

## API Endpoints

### 1. Evaluate Account
**GET** `/api/v2/{address}/`

Evaluates a public Algorand address and returns comprehensive data about ASAs and NFTs owned.

#### Parameters
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `address` | string | Yes | Algorand address to evaluate |
| `format` | string | No | Response format (json, xml, yaml) |
| `headers` | boolean | No | Return only headers |
| `limit` | integer | No | Limit number of ASA items and NFT collections |
| `usd` | boolean | No | Return values in USD |

#### Example Request
```bash
curl -X 'GET' \
  'https://www.asastats.com/api/v2/2evgz4bgosl3j64uyde2bugtntbzzzli54vuqqnzzlycdodly33ugxnsiu/' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

#### Example Response Structure
```json
{
  "account_info": {
    "addresses": ["G54HYCO33ZESZJ5P3IKMQMG5EOZNNUQAMS75K3CSR3VLGPLZBSHCVKOL5A"],
    "bundle": null,
    "values_in": "ALGO",
    "online": null
  },
  "system_info": {},
  "total": {
    "algo": "59977.466525",
    "asa": "36928.718197", 
    "nft": "1762.860000",
    "total": "98669.044722",
    "totalusdc": "25921.961523",
    "priceusdc": "3.806388",
    "pricealgo": "0.262716",
    "noteval": 1,
    "totalwonft": "96906.184722",
    "totalwonftusdc": "25458.829553"
  },
  "asaitems": [...],
  "nftcollections": [...]
}
```

### 2. Refresh Token
**POST** `/api/v2/token/refresh/`

Refreshes an access token using a refresh token.

#### Request Body
```json
{
  "refresh": "YOUR_REFRESH_TOKEN"
}
```

#### Example Request
```bash
curl -X 'POST' \
  'https://www.asastats.com/api/v2/token/refresh/' \
  -H 'Content-Type: application/json' \
  -d '{
    "refresh": "YOUR_REFRESH_TOKEN"
  }'
```

#### Response
```json
{
  "access": "NEW_ACCESS_TOKEN",
  "refresh": "NEW_REFRESH_TOKEN"
}
```

## Program Types

The ASA Stats API tracks assets across different DeFi programs and protocols. There are **17 different program types** that categorize how assets are being used:

### Program Type Categories

| Program Type | Description | Common Use Cases |
|--------------|-------------|------------------|
| **Amount** | General asset amount tracking | Basic balance tracking, asset inbox |
| **Balance** | Available/accessible balance | Liquid funds ready for use |
| **Borrowed** | Assets borrowed from lending protocols | DeFi loans, margin trading |
| **Claimable** | Rewards or tokens ready to claim | Staking rewards, airdrops |
| **Collateral** | Assets used as loan collateral | DeFi lending protocols |
| **Committed** | Assets committed to future actions | Governance voting, vesting |
| **Debt** | Outstanding debt obligations | Loans, credit positions |
| **Delegated** | Assets delegated to validators | Staking, consensus participation |
| **Deposited** | Assets deposited in protocols | Yield farming, liquidity provision |
| **Locked** | Temporarily locked assets | Time-locked positions, vesting |
| **Pre-minted** | Assets available for minting | NFT pre-sales, token launches |
| **Size** | Position size indicators | Trading positions, portfolio metrics |
| **Staked** | Assets actively staking | Validator staking, protocol staking |
| **Supplied** | Assets supplied to lending pools | DeFi lending, yield generation |
| **Value** | Value-based tracking | Portfolio valuations, price tracking |
| **Vault** | Assets in vault contracts | Security vaults, multi-sig wallets |
| **Withdrawal** | Assets pending withdrawal | Exit positions, unstaking |

### Program Type Examples

```json
{
  "programs": [
    {
      "program": {
        "type": "Staked",
        "name": "Reti Pooling",
        "provider": {
          "name": "Reti"
        },
        "url": "https://reti.nodely.io/validators/64"
      },
      "value": "59130.998589",
      "amount": 59130998589
    },
    {
      "program": {
        "type": "Deposited",
        "name": "Folks v2 deposit",
        "provider": {
          "name": "Folks"
        },
        "url": "https://app.folks.finance/deposit"
      },
      "value": "27365.095564",
      "amount": 6250481
    },
    {
      "program": {
        "type": "Collateral",
        "name": "Folks v2 collateral",
        "provider": {
          "name": "Folks"
        },
        "url": "https://app.folks.finance/loans"
      },
      "value": "4489.572095",
      "amount": 1000206
    }
  ]
}
```

## Response Data Structure

### Account Information
- `addresses`: Array of account addresses
- `bundle`: Bundle information (if applicable)
- `values_in`: Currency for values ("ALGO" or "USD")
- `online`: Online status

### Portfolio Totals
- `algo`: Total ALGO balance
- `asa`: Total ASA value
- `nft`: Total NFT value
- `total`: Total portfolio value
- `totalusdc`: Total value in USDC
- `priceusdc`: ALGO price in USDC
- `pricealgo`: ALGO price
- `noteval`: Number of non-evaluated items
- `totalwonft`: Total value excluding NFTs
- `totalwonftusdc`: Total value excluding NFTs in USDC

### ASA Items
Each ASA item contains:
- `value`: Current value
- `asset`: Asset information (id, name, unit, decimals, etc.)
- `amount`: Quantity held
- `price`: Current price
- `programs`: Array of programs (staking, liquidity, etc.)

### NFT Collections
Each NFT collection contains:
- `value`: Collection value
- `name`: Collection name
- `amount`: Number of NFTs
- `nfts`: Array of individual NFTs

## Usage Examples

### JavaScript/TypeScript
```typescript
// Fetch account data
async function fetchAccountData(address: string, accessToken: string) {
  const response = await fetch(
    `https://www.asastats.com/api/v2/${address}/`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
}

// Refresh token
async function refreshToken(refreshToken: string) {
  const response = await fetch(
    'https://www.asastats.com/api/v2/token/refresh/',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh: refreshToken })
    }
  );
  
  return await response.json();
}
```

### Python
```python
import requests

def fetch_account_data(address, access_token):
    url = f"https://www.asastats.com/api/v2/{address}/"
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Accept': 'application/json'
    }
    
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

def refresh_token(refresh_token):
    url = "https://www.asastats.com/api/v2/token/refresh/"
    data = {"refresh": refresh_token}
    
    response = requests.post(url, json=data)
    response.raise_for_status()
    return response.json()
```

## Error Handling

### Common HTTP Status Codes
- `200`: Success
- `401`: Unauthorized (invalid or expired token)
- `404`: Address not found
- `429`: Rate limit exceeded
- `500`: Server error

### Error Response Format
```json
{
  "detail": "Error message description"
}
```

## Rate Limits

The API has rate limiting in place. Implement exponential backoff for retries and respect the rate limits to avoid being blocked.

## Best Practices

1. **Token Management**: Store refresh tokens securely and use them to obtain new access tokens when needed
2. **Error Handling**: Always check response status codes and handle errors gracefully
3. **Caching**: Cache account data when possible to reduce API calls
4. **Validation**: Validate Algorand addresses before making API calls
5. **Rate Limiting**: Implement proper rate limiting in your applications
6. **Program Type Analysis**: Use program types to understand how assets are deployed across different DeFi protocols

## Integration Notes

- All monetary values are returned as strings to preserve precision
- Asset IDs are integers representing the ASA ID on Algorand
- NFT metadata includes traits, rarity, and marketplace listings
- Program data shows where assets are deployed (staking, liquidity, etc.)
- USD values are approximate and may vary based on market conditions
- Program types help categorize asset usage across different DeFi protocols

## Support

For API support or to obtain authentication tokens, contact the ASA Stats team through their official channels. 