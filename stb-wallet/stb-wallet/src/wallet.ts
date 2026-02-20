import { STB } from "./stbChain";
import { SigningStargateClient, defaultRegistryTypes } from "@cosmjs/stargate";
import { Registry } from "@cosmjs/proto-signing";
import * as _m0 from "protobufjs/minimal";

// -----------------------------
// Stablecoin module messages (handwritten, matching proto/stbchain/stablecoin/v1/tx.proto)
// typeUrls:
//  - /stbchain.stablecoin.v1.MsgMint
//  - /stbchain.stablecoin.v1.MsgBurn
// -----------------------------

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;
type DeepPartial<T> = T extends Builtin
  ? T
  : T extends Array<infer U>
  ? Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U>>
  : T extends {}
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type MsgMintType = { authority: string; toAddress: string; amount: string };
type MsgBurnType = { authority: string; fromAddress: string; amount: string };

function createBaseMsgMint(): MsgMintType {
  return { authority: "", toAddress: "", amount: "" };
}
function createBaseMsgBurn(): MsgBurnType {
  return { authority: "", fromAddress: "", amount: "" };
}

const MsgMintCodec = {
  encode(message: MsgMintType, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    // field 1: authority
    if (message.authority !== "") writer.uint32(10).string(message.authority);
    // field 2: to_address
    if (message.toAddress !== "") writer.uint32(18).string(message.toAddress);
    // field 3: amount
    if (message.amount !== "") writer.uint32(26).string(message.amount);
    return writer;
  },
  decode(input: _m0.Reader | Uint8Array, length?: number): MsgMintType {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMsgMint();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.authority = reader.string();
          break;
        case 2:
          message.toAddress = reader.string();
          break;
        case 3:
          message.amount = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
  fromPartial(object: DeepPartial<MsgMintType>): MsgMintType {
    const message = createBaseMsgMint();
    message.authority = object.authority ?? "";
    message.toAddress = object.toAddress ?? "";
    message.amount = object.amount ?? "";
    return message;
  },
};

const MsgBurnCodec = {
  encode(message: MsgBurnType, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    // field 1: authority
    if (message.authority !== "") writer.uint32(10).string(message.authority);
    // field 2: from_address
    if (message.fromAddress !== "") writer.uint32(18).string(message.fromAddress);
    // field 3: amount
    if (message.amount !== "") writer.uint32(26).string(message.amount);
    return writer;
  },
  decode(input: _m0.Reader | Uint8Array, length?: number): MsgBurnType {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMsgBurn();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.authority = reader.string();
          break;
        case 2:
          message.fromAddress = reader.string();
          break;
        case 3:
          message.amount = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },
  fromPartial(object: DeepPartial<MsgBurnType>): MsgBurnType {
    const message = createBaseMsgBurn();
    message.authority = object.authority ?? "";
    message.fromAddress = object.fromAddress ?? "";
    message.amount = object.amount ?? "";
    return message;
  },
};

type KeplrLike = {
  enable: (chainId: string) => Promise<void>;
  experimentalSuggestChain?: (chainInfo: any) => Promise<void>;
  getOfflineSignerAuto: (chainId: string) => Promise<any>;
};

function getWalletProvider(): KeplrLike | null {
  const w = window as any;
  return (w.keplr || w.leap) ?? null;
}

export async function connectWallet() {
  const keplr = getWalletProvider();
  if (!keplr) throw new Error("Не найден Keplr или Leap (поставь расширение).");

  if (keplr.experimentalSuggestChain) {
    await keplr.experimentalSuggestChain({
      chainId: STB.chainId,
      chainName: STB.chainName,
      rpc: STB.rpc,
      rest: STB.rest,
      stakeCurrency: STB.stakeCurrency,
      bip44: STB.bip44,
      bech32Config: STB.bech32Config,
      currencies: [STB.stakeCurrency],
      feeCurrencies: [STB.stakeCurrency],
    });
  }

  await keplr.enable(STB.chainId);
  const signer = await keplr.getOfflineSignerAuto(STB.chainId);
  const accounts = await signer.getAccounts();
  const address = accounts[0]?.address;
  if (!address) throw new Error("Не удалось получить адрес из кошелька.");
  
  const rpcUrl = new URL(STB.rpcWeb, window.location.origin).toString();

  const registry = new Registry(defaultRegistryTypes);
  registry.register("/stbchain.stablecoin.v1.MsgMint", MsgMintCodec as any);
  registry.register("/stbchain.stablecoin.v1.MsgBurn", MsgBurnCodec as any);

  const client = await SigningStargateClient.connectWithSigner(rpcUrl, signer, { registry });
  return { address, client };
}

export async function getUstbBalance(client: SigningStargateClient, address: string) {
  return client.getBalance(address, "ustb");
}

export async function sendUstb(
  client: SigningStargateClient,
  from: string,
  to: string,
  amountUstb: string
) {
  const fee = {
    amount: [{ denom: "ustb", amount: "5000" }],
    gas: "200000",
  };

  return client.sendTokens(
    from,
    to,
    [{ denom: "ustb", amount: amountUstb }],
    fee
  );
}


// -----------------------------
// History (via CometBFT RPC /rpc proxy)
// -----------------------------

export type TxHistoryItem = {
  txhash: string;
  height: number;
  timestamp?: string; // RPC tx_search doesn't include timestamp; keep optional
  kind: "send" | "receive" | "other";
  amountUstb?: string;
  counterparty?: string;
};

async function rpcCall<T = any>(method: string, params: Record<string, any>) {
  // STB.rpcWeb should be "/rpc" (Vite proxy) and forward to CometBFT RPC root.
  const url = new URL(STB.rpcWeb, window.location.origin).toString();

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });

  const json = await res.json().catch(async () => {
    const txt = await res.text().catch(() => "");
    throw new Error(`RPC parse error: ${txt}`);
  });

  if (!res.ok) {
    throw new Error(`RPC ${res.status}: ${JSON.stringify(json)}`);
  }
  if (json?.error) {
    throw new Error(`RPC error: ${JSON.stringify(json)}`);
  }

  return json.result as T;
}

function attrsToMapOne(e: any): Record<string, string> {
  const a = e?.attributes ?? [];
  const map: Record<string, string> = {};
  for (const it of a) {
    const k = it?.key;
    const v = it?.value;
    if (typeof k === "string" && typeof v === "string") map[k] = v;
  }
  return map;
}

function allEventMaps(evs: any[], type: string): Record<string, string>[] {
  return (evs || []).filter((x: any) => x?.type === type).map(attrsToMapOne);
}

function parseTxResult(address: string, tx: any): TxHistoryItem {
  const evs = tx?.tx_result?.events ?? [];
  const transfers = allEventMaps(evs, "transfer");

  type Cand = { tr: Record<string, string>; ustbAmount: bigint; score: number };

  const candidates: Cand[] = [];
  for (const tr of transfers) {
    const sender = tr["sender"];
    const recipient = tr["recipient"];
    const amount = tr["amount"];
    if (!sender || !recipient || !amount) continue;

    const parts = String(amount)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const ustbPart = parts.find((p) => p.endsWith("ustb"));
    if (!ustbPart) continue;

    const involvesAddr = sender === address || recipient === address;
    if (!involvesAddr) continue;

    const numStr = ustbPart.replace(/ustb$/, "");
    let ustbAmount = 0n;
    try {
      ustbAmount = BigInt(numStr);
    } catch {
      ustbAmount = 0n;
    }

    // Heuristics:
    // - real MsgSend transfer usually has msg_index attribute
    // - real transfer amount is usually larger than fee amount
    const hasMsgIndex = typeof tr["msg_index"] === "string" && tr["msg_index"].length > 0;
    const score = (hasMsgIndex ? 1000 : 0) + Number(ustbAmount > 0n ? (ustbAmount > 10000n ? 10 : 1) : 0);

    candidates.push({ tr, ustbAmount, score });
  }

  const pick = candidates
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // tie-breaker: pick larger amount
      if (b.ustbAmount !== a.ustbAmount) return b.ustbAmount > a.ustbAmount ? 1 : -1;
      return 0;
    })
    .map((c) => c.tr)[0];

  let kind: TxHistoryItem["kind"] = "other";
  let counterparty: string | undefined;
  let amountUstb: string | undefined;

  if (pick) {
    const sender = pick["sender"];
    const recipient = pick["recipient"];
    const amount = pick["amount"];

    const parts = String(amount)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const ustbPart = parts.find((p) => p.endsWith("ustb"));
    if (ustbPart) amountUstb = ustbPart.replace(/ustb$/, "");

    if (sender === address) {
      kind = "send";
      counterparty = recipient;
    } else if (recipient === address) {
      kind = "receive";
      counterparty = sender;
    }
  }

  return {
    txhash: tx?.hash ?? "",
    height: Number(tx?.height ?? 0),
    kind,
    amountUstb,
    counterparty,
  };
}

export async function fetchTxHistory(address: string, limit = 20): Promise<TxHistoryItem[]> {
  const a = address.trim();
  if (!a) return [];

  const qIn = `transfer.recipient='${a}'`;
  const qOut = `message.sender='${a}'`;

  const [inRes, outRes] = await Promise.all([
    rpcCall<{ txs?: any[] }>("tx_search", {
      query: qIn,
      page: "1",
      per_page: String(limit),
      order_by: "desc",
    }),
    rpcCall<{ txs?: any[] }>("tx_search", {
      query: qOut,
      page: "1",
      per_page: String(limit),
      order_by: "desc",
    }),
  ]);

  const txs: any[] = [
    ...((inRes?.txs as any[]) ?? []),
    ...((outRes?.txs as any[]) ?? []),
  ];

  // de-dup by hash
  const seen = new Set<string>();
  const items: TxHistoryItem[] = [];

  for (const t of txs) {
    const h = t?.hash;
    if (!h || seen.has(h)) continue;
    seen.add(h);

    items.push(parseTxResult(a, t));
  }

  items.sort((x, y) => (y.height - x.height) || y.txhash.localeCompare(x.txhash));
  return items.slice(0, limit);
}

export async function mintUstb(
  client: SigningStargateClient,
  authority: string,
  toAddress: string,
  amountUstb: string
) {
  const msg = {
    typeUrl: "/stbchain.stablecoin.v1.MsgMint",
    value: MsgMintCodec.fromPartial({ authority, toAddress, amount: amountUstb }),
  };

  const fee = {
    amount: [{ denom: "ustb", amount: "5000" }],
    gas: "200000",
  };

  return client.signAndBroadcast(authority, [msg], fee);
}

export async function burnUstb(
  client: SigningStargateClient,
  authority: string,
  fromAddress: string,
  amountUstb: string
) {
  const msg = {
    typeUrl: "/stbchain.stablecoin.v1.MsgBurn",
    value: MsgBurnCodec.fromPartial({ authority, fromAddress, amount: amountUstb }),
  };

  const fee = {
    amount: [{ denom: "ustb", amount: "5000" }],
    gas: "200000",
  };

  return client.signAndBroadcast(authority, [msg], fee);
}