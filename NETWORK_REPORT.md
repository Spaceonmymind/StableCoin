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