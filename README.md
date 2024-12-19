# Block Timestamp API

Built for the replacement of Blocks Subgraph, useful when querying blocks with timestamp range (usually required when drawing charts)

Something like https://www.quicknode.com/docs/ethereum/qn_getBlocksInTimestampRange

## Disclaimer

This API & indexer is mainly to assume blocks on the specific historic range not to index some trustworthy block DB like how etherscan does. The API doesn't have reorg detection so do not use for other purpose rather than fetching block numbers

## Technical Requirements

+ Latest LTS version of Node.js (20.x or 22.x recommended)

+ RPC node & ChainID (Supply them with RPC_URL env value, see ./src/config.ts for available ENV variables).

+ MongoDB (Stores blockHash, blockNum, and timestamp)

## How to install

```bash
# Install libraries
yarn

# Setup ENV (RPC, ChainID - EIP-155 - can be found on chainlist.org)
nano .env

# Start indexer & API
yarn start

# Can be used to clear DB
yarn reset
```

Required ENV

```
CHAIN_ID="1"
RPC_URL="https://rpc.mevblocker.io"
MONGO_URL="mongodb://127.0.0.1:27017/ethBlocks"
```

## Query example

### `GET /`

* Returns API Status

```
{
  "chainId": 1,
  "localBlock": 21436500,
  "onSync": false,
  "errors": []
}
```

### `POST /`

* Returns block numbers inside the timestamp range (Limited to 100 blocks per request, 30 request per array)

Request Body

```json
{
    "id": 0,
    "length": 1,
    "timestamp_gte": 1734612500,
    "timestamp_lte": 1734612580
}
```

or

```json
[
  {
    "id": 0,
    "length": 1,
    "timestamp_gte": 1734612500,
    "timestamp_lte": 1734612580
  },
  {}
]
```

Response

```json
[{
    "id": 0,
    "blocks": []
}, {
    "id": 1,
    "blocks": []
}]
```

### `GET /number/:blockNumber` or `GET /hash/:blockHash`

* Returns block object if found (if not will return empty object)

