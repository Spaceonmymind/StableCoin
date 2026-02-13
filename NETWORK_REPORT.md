# STB Chain — Network Report (Local Devnet)

## Endpoints
- RPC: http://localhost:26657
- REST: http://localhost:1317

## Status (RPC /status)
```json
{
  "jsonrpc": "2.0",
  "id": -1,
  "result": {
    "node_info": {
      "protocol_version": {
        "p2p": "8",
        "block": "11",
        "app": "0"
      },
      "id": "757efe652a829b674e840c5449ad6c5511b25687",
      "listen_addr": "tcp://0.0.0.0:26656",
      "network": "stbchain",
      "version": "0.38.19",
      "channels": "40202122233038606100",
      "moniker": "mynode",
      "other": {
        "tx_index": "on",
        "rpc_address": "tcp://0.0.0.0:26657"
      }
    },
    "sync_info": {
      "latest_block_hash": "ECECA35E4455CBDD56BC9BE86F9FD7FE9BBCB46EA58D4796208ED1A49A499B13",
      "latest_app_hash": "EB7AB787B34B2EE79D110FF1DE4E07F3BE5029A03450DF5687E275E7C73AAC70",
      "latest_block_height": "627",
      "latest_block_time": "2026-02-04T09:31:22.491891Z",
      "earliest_block_hash": "E735D4E3C1583D4BF2D3289C92FAFEDAA93172DA7A12658CCD6A61B902B38F4F",
      "earliest_app_hash": "E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855",
      "earliest_block_height": "1",
      "earliest_block_time": "2026-02-04T09:20:23.113163Z",
      "catching_up": false
    },
    "validator_info": {
      "address": "6C52E7BB930889836014357040A9E25AE559E3F9",
      "pub_key": {
        "type": "tendermint/PubKeyEd25519",
        "value": "sWOqMp7+XevOas0DMR+AbUiqPTD1hebsY52zyKhxT1s="
      },
      "voting_power": "100"
    }
  }
}



egorgladkih@MacBook-Air-Egor-2 ~/Visual Studo Projects/STB_20260204/stbchain (main*) $ echo "=== STATUS NODE1 ==="
curl -s http://localhost:26657/status | jq '.result.node_info.network, .result.sync_info.latest_block_height'

echo "=== STATUS NODE2 ==="
curl -s http://localhost:26667/status | jq '.result.node_info.network, .result.sync_info.latest_block_height'

=== STATUS NODE1 ===
"stbchain-local"
"87"
=== STATUS NODE2 ===
"stbchain-local"
"87"
egorgladkih@MacBook-Air-Egor-2 ~/Visual Studo Projects/STB_20260204/stbchain (main*) $ echo "=== PEERS NODE1 ==="
curl -s http://localhost:26657/net_info | jq '.result.n_peers'

echo "=== PEERS NODE2 ==="
curl -s http://localhost:26667/net_info | jq '.result.n_peers'

=== PEERS NODE1 ===
"1"
=== PEERS NODE2 ===
"1"
egorgladkih@MacBook-Air-Egor-2 ~/Visual Studo Projects/STB_20260204/stbchain (main*) $ echo "=== VALIDATORS COUNT ==="
curl -s http://localhost:26657/validators | jq '.result.validators | length'

echo "=== VALIDATORS PUBKEYS ==="
curl -s http://localhost:26657/validators | jq '.result.validators[].address'

=== VALIDATORS COUNT ===
2
=== VALIDATORS PUBKEYS ===
"1F8FA33043474B45B6D214B88555B576A1DA8126"
"429EE67AAC6E4CCCF67D7EC239080CBCA0B74B4B"
egorgladkih@MacBook-Air-Egor-2 ~/Visual Studo Projects/STB_20260204/stbchain (main*) $ echo "=== PROPOSER HEIGHT 1 ==="
curl -s http://localhost:26657/commit\?height\=1 | jq '.result.signed_header.header.proposer_address'

echo "=== PROPOSER HEIGHT 2 ==="
curl -s http://localhost:26657/commit\?height\=2 | jq '.result.signed_header.header.proposer_address'

echo "=== PROPOSER HEIGHT 3 ==="
curl -s http://localhost:26657/commit\?height\=3 | jq '.result.signed_header.header.proposer_address'

=== PROPOSER HEIGHT 1 ===
"429EE67AAC6E4CCCF67D7EC239080CBCA0B74B4B"
=== PROPOSER HEIGHT 2 ===
"429EE67AAC6E4CCCF67D7EC239080CBCA0B74B4B"
=== PROPOSER HEIGHT 3 ===
"1F8FA33043474B45B6D214B88555B576A1DA8126"
egorgladkih@MacBook-Air-Egor-2 ~/Visual Studo Projects/STB_20260204/stbchain (main*) $ stbchaind query stablecoin params --node tcp://localhost:26657

params:
  denom: ustb
  issuer: cosmos19jvll7zgcj6fafavwa8e5gns77shtt8dr430g8
egorgladkih@MacBook-Air-Egor-2 ~/Visual Studo Projects/STB_20260204/stbchain (main*) $ stbchaind query stablecoin params --node tcp://localhost:26657

params:
  denom: ustb
  issuer: cosmos19jvll7zgcj6fafavwa8e5gns77shtt8dr430g8
egorgladkih@MacBook-Air-Egor-2 ~/Visual Studo Projects/STB_20260204/stbchain (main*) $ VAL1=$(stbchaind keys show val1 -a --home ~/.stbnode1 --keyring-backend test)
VAL2=$(stbchaind keys show val2 -a --home ~/.stbnode2 --keyring-backend test)

echo "=== BALANCE VAL1 ==="
stbchaind query bank balances $VAL1 --node tcp://localhost:26657

echo "=== BALANCE VAL2 ==="
stbchaind query bank balances $VAL2 --node tcp://localhost:26657

=== BALANCE VAL1 ===
balances:
- amount: "50000000"
  denom: stake
pagination:
  total: "1"
=== BALANCE VAL2 ===
balances:
- amount: "50000000"
  denom: stake
pagination:
  total: "1"
egorgladkih@MacBook-Air-Egor-2 ~/Visual Studo Projects/STB_20260204/stbchain (main*) $ VAL1=$(stbchaind keys show val1 -a --home ~/.stbnode1 --keyring-backend test)
VAL2=$(stbchaind keys show val2 -a --home ~/.stbnode2 --keyring-backend test)

echo "=== BALANCE VAL1 ==="
stbchaind query bank balances $VAL1 --node tcp://localhost:26657

echo "=== BALANCE VAL2 ==="
stbchaind query bank balances $VAL2 --node tcp://localhost:26657

=== BALANCE VAL1 ===
balances:
- amount: "50000000"
  denom: stake
pagination:
  total: "1"
=== BALANCE VAL2 ===
balances:
- amount: "50000000"
  denom: stake
pagination:
  total: "1"
egorgladkih@MacBook-Air-Ego