import { useMemo, useState } from "react";
import * as wallet from "./wallet";
import type { TxHistoryItem } from "./wallet";
import { STB } from "./stbChain";

export default function App() {
  const [addressState, setAddressState] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [balance, setBalance] = useState<string>("-");
  const [testBalance, setTestBalance] = useState<string>("-");
  const [client, setClient] = useState<any>(null);
  const [sendTo, setSendTo] = useState<string>("");
  const [sendAmount, setSendAmount] = useState<string>("");
  const [history, setHistory] = useState<TxHistoryItem[]>([]);
  const [historyStatus, setHistoryStatus] = useState<string>("-");
  
  const [mintTarget, setMintTarget] = useState<"self" | "test">("self");
  const [mintAmount, setMintAmount] = useState<string>("1");

  const [burnTarget, setBurnTarget] = useState<"self" | "test">("self");
  const [burnAmount, setBurnAmount] = useState<string>("1");

  const isIssuer = useMemo(() => {
    return !!addressState && addressState === (STB as any).issuer;
  }, [addressState]);

  function formatUstb(amount: string): string {
    const decimals = 6;
    const num = Number(amount);
    if (Number.isNaN(num)) return amount;

    const whole = Math.floor(num / 10 ** decimals);
    const fraction = (num % 10 ** decimals)
      .toString()
      .padStart(decimals, "0");

    return `${whole}.${fraction} STB`;
  }

  async function onConnect() {
    console.log("CLICK connect");
    setStatus("Connecting...");
    try {
      const { address: walletAddress, client } = await wallet.connectWallet();
      console.log("CONNECTED address=", walletAddress);

      // Update UI immediately
      setAddressState(walletAddress);
      setClient(client);
      void refreshHistory(walletAddress);
      setStatus("Connected");
      setBalance("Loading...");

      // Fetch balance in the background so the UI doesn't stay stuck on "-"
      void (async () => {
        try {
          const bal = await wallet.getUstbBalance(client, walletAddress);
          setBalance(formatUstb(bal.amount));
          await refreshTestBalance(client);
        } catch (e: any) {
          console.error("BALANCE ERROR", e);
          setBalance("Error");
        }
      })();
    } catch (e: any) {
      console.error("CONNECT ERROR", e);
      setStatus(e?.message ?? String(e));
    }
  }

  async function refreshBalance() {
    if (!client || !addressState) {
      setStatus("Сначала подключи кошелёк");
      return;
    }

    

    setBalance("Loading...");

    try {
      const bal = await wallet.getUstbBalance(client, addressState);
      setBalance(formatUstb(bal.amount));
    } catch (e: any) {
      console.error("BALANCE ERROR", e);
      setBalance("Error");
    }
  }

  async function refreshTestBalance(c?: any) {
    const activeClient = c ?? client;
    try {
      const addr = (STB as any).testRecipient as string | undefined;
      if (!addr || !activeClient) {
        setTestBalance("-");
        return;
      }

      const bal = await wallet.getUstbBalance(activeClient, addr);
      setTestBalance(formatUstb(bal.amount));
    } catch (e: any) {
      console.error("TEST BALANCE ERROR", e);
      setTestBalance("Error");
    }
  }

  function parseStbToUstb(amountStb: string): string {
    const trimmed = amountStb.trim().replace(",", ".");
    if (!trimmed) return "";

    // Avoid floating point issues by working with strings
    const [wholePart, fracPartRaw = ""] = trimmed.split(".");
    const wholeDigits = wholePart.replace(/\D/g, "") || "0";
    const fracDigits = fracPartRaw.replace(/\D/g, "").slice(0, 6);
    const fracPadded = fracDigits.padEnd(6, "0");

    const ustb = BigInt(wholeDigits) * 1000000n + BigInt(fracPadded || "0");
    return ustb.toString();
  }

  async function handleSend() {
    if (!client || !addressState) {
      setStatus("Сначала подключи кошелёк");
      return;
    }
    if (!sendTo.trim() || !sendAmount.trim()) {
      setStatus("Укажи адрес и сумму");
      return;
    }

    const amountUstb = parseStbToUstb(sendAmount);
    if (!amountUstb || amountUstb === "0") {
      setStatus("Сумма должна быть больше 0");
      return;
    }

    try {
      setStatus("Отправка... (подтверди в кошельке)");
      const result = await wallet.sendUstb(client, addressState, sendTo.trim(), amountUstb);
      setStatus(`Успешно! txHash: ${result.transactionHash}`);
      await refreshBalance();
      await refreshHistory();
    } catch (e: any) {
      console.error("SEND ERROR", e);
      setStatus(e?.message ?? "Ошибка отправки");
    }
  }

  async function handleMint() {
    if (!client || !addressState) {
      setStatus("Сначала подключи кошелёк");
      return;
    }
    if (!isIssuer) {
      setStatus("Mint доступен только issuer-аккаунту");
      return;
    }

    const to = mintTarget === "self" ? addressState : (STB as any).testRecipient;
    if (!to) {
      setStatus("Не задан тестовый адрес получателя");
      return;
    }

    const amountUstb = parseStbToUstb(mintAmount);
    if (!amountUstb || amountUstb === "0") {
      setStatus("Сумма должна быть больше 0");
      return;
    }

    try {
      setStatus("Mint... (подтверди в кошельке)");
      const mintFn = (wallet as any).mintUstb;
      if (typeof mintFn !== "function") {
        throw new Error("Mint ещё не подключён в wallet.ts (нужно добавить MsgMint).");
      }
      const res = await mintFn(client, addressState, to, amountUstb);

      if (res?.code && res.code !== 0) {
        setStatus(`Mint FAILED (code ${res.code}): ${res.rawLog ?? res.raw_log ?? ""}`);
        return;
      }

      setStatus(`Mint OK! txHash: ${res?.transactionHash ?? res?.txhash ?? "-"}`);
      await refreshBalance();
      await refreshTestBalance();
      await refreshHistory(addressState);
    } catch (e: any) {
      console.error("MINT ERROR", e);
      setStatus(e?.message ?? "Ошибка mint");
    }
  }

  async function handleBurn() {
    if (!client || !addressState) {
      setStatus("Сначала подключи кошелёк");
      return;
    }
    if (!isIssuer) {
      setStatus("Burn доступен только issuer-аккаунту");
      return;
    }

    const fromAddr = burnTarget === "self" ? addressState : (STB as any).testRecipient;
    if (!fromAddr) {
      setStatus("Не задан тестовый адрес для Burn");
      return;
    }

    const amountUstb = parseStbToUstb(burnAmount);
    if (!amountUstb || amountUstb === "0") {
      setStatus("Сумма должна быть больше 0");
      return;
    }

    try {
      setStatus("Burn... (подтверди в кошельке)");
      const burnFn = (wallet as any).burnUstb;
      if (typeof burnFn !== "function") {
        throw new Error("Burn ещё не подключён в wallet.ts (нужно добавить MsgBurn).");
      }
      // Try common signatures: (client, authority, fromAddress, amount) OR (client, authority, amount)
      let res: any;
      if (burnFn.length >= 4) {
        // правильная сигнатура: (client, authority, fromAddress, amount)
        res = await burnFn(client, addressState, fromAddr, amountUstb);
      } else {
        // fallback: если функция в wallet.ts вдруг принимает только (client, authority, amount)
        res = await burnFn(client, addressState, amountUstb);
      }

      // ВАЖНО: SigningStargateClient возвращает code/rawLog — txHash есть даже при ошибке
      if (res?.code && res.code !== 0) {
        setStatus(`Burn FAILED (code ${res.code}): ${res.rawLog ?? res.raw_log ?? ""}`);
        return;
      }

      setStatus(`Burn OK! txHash: ${res?.transactionHash ?? res?.txhash ?? "-"}`);
      await refreshBalance();
      await refreshTestBalance();
      await refreshHistory(addressState);
    } catch (e: any) {
      console.error("BURN ERROR", e);
      setStatus(e?.message ?? "Ошибка burn");
    }
  }

  async function refreshHistory(addr?: string) {
    const a = (addr ?? addressState).trim();
    if (!a) {
      setHistoryStatus("Сначала подключи кошелёк");
      return;
    }

    setHistoryStatus("Loading...");
    try {
      const items = await wallet.fetchTxHistory(a, 20);
      setHistory(items);
      setHistoryStatus(items.length ? "OK" : "Пусто");
    } catch (e: any) {
      console.error("HISTORY ERROR", e);
      setHistoryStatus(e?.message ?? "Ошибка загрузки истории");
    }
  }

  return (
    <div className="container">
      <div className="header">
        <div>
          <div className="hTitle">STB Wallet</div>
          <div className="hSub">
            Chain: <b>{STB.chainId}</b> • RPC: <span className="muted">{STB.rpc}</span> • REST: <span className="muted">{STB.rest}</span>
          </div>
        </div>

        <div className="actions">
          <button className="btn btnPrimary" onClick={onConnect}>
            Подключить Keplr/Leap
          </button>
          <button className="btn" onClick={refreshBalance} disabled={!addressState}>
            Обновить баланс
          </button>
          <button className="btn" onClick={() => refreshTestBalance()} disabled={!addressState}>
            Баланс тестового
          </button>
          <button className="btn" onClick={() => refreshHistory()} disabled={!addressState}>
            Обновить историю
          </button>
        </div>
      </div>

      <div className="grid">
        {/* Left column */}
        <div className="card">
          <div className="cardTitle">
            <h2>Обзор</h2>
            <span className="pill">
              {status ? (
                <>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: status === "Connected" ? "var(--ok)" : "var(--accent)" }} />
                  {status}
                </>
              ) : (
                "-"
              )}
            </span>
          </div>

          <div className="row" style={{ marginBottom: 10 }}>
            <div className="kv">
              <div className="k">Адрес</div>
              <div className="v">{addressState || "-"}</div>
            </div>
            <div className="kv" style={{ textAlign: "right" }}>
              <div className="k">Длина</div>
              <div className="v">{addressState ? addressState.length : 0}</div>
            </div>
          </div>

          <div className="row">
            <div className="kv">
              <div className="k">Баланс</div>
              <div className="v bigBalance">{balance}</div>
            </div>
            <div className="kv" style={{ textAlign: "right" }}>
              <div className="k">История</div>
              <div className="v">{historyStatus || "-"}</div>
            </div>
          </div>

          <div className="row" style={{ marginTop: 10 }}>
            <div className="kv">
              <div className="k">Тестовый адрес</div>
              <div className="v">{(STB as any).testRecipient || "-"}</div>
            </div>
            <div className="kv" style={{ textAlign: "right" }}>
              <div className="k">Баланс тестового</div>
              <div className="v">{testBalance}</div>
            </div>
          </div>

          <div className="divider" />

          {isIssuer ? (
            <div className="help">
             
            </div>
          ) : (
            <div className="help">
              Mint/Burn доступны только для issuer: <span className="txHash">{(STB as any).issuer}</span>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="card">
          <div className="cardTitle">
            <h2>Отправить STB</h2>
            <span className="pill">denom: ustb</span>
          </div>

          <div className="form">
            <input
              className="input"
              placeholder="Адрес получателя (cosmos1...)"
              value={sendTo}
              onChange={(e) => setSendTo(e.target.value)}
            />
            <input
              className="input"
              placeholder="Сумма в STB (например 1.5)"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
            />
            <button className="btn btnPrimary" onClick={handleSend} disabled={!addressState}>
              Отправить
            </button>
          </div>
        </div>

        {/* Issuer Mint/Burn card */}
        {isIssuer ? (
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <div className="cardTitle">
              <h2>Issuer: Mint / Burn</h2>
              <span className="pill">issuer: <span className="txHash">{(STB as any).issuer}</span></span>
            </div>

            <div className="divider" />

            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="card" style={{ background: "rgba(255,255,255,.03)", boxShadow: "none" }}>
                <div className="cardTitle">
                  <h2>Mint</h2>
                  <span className="pill">/stbchain.stablecoin.v1.MsgMint</span>
                </div>

                <div className="form">
                  <div className="row">
                    <div className="kv">
                      <div className="k">Получатель</div>
                      <div className="v">
                        {(mintTarget === "self" ? addressState : (STB as any).testRecipient) || "-"}
                      </div>
                    </div>
                    <div className="actions">
                      <button
                        className={`btn ${mintTarget === "self" ? "btnPrimary" : ""}`}
                        onClick={() => setMintTarget("self")}
                        type="button"
                      >
                        Себе
                      </button>
                      <button
                        className={`btn ${mintTarget === "test" ? "btnPrimary" : ""}`}
                        onClick={() => setMintTarget("test")}
                        type="button"
                      >
                        Тест
                      </button>
                    </div>
                  </div>

                  <input
                    className="input"
                    placeholder="Сумма для Mint в STB (например 1)"
                    value={mintAmount}
                    onChange={(e) => setMintAmount(e.target.value)}
                  />

                  <button className="btn btnPrimary" onClick={handleMint} disabled={!addressState}>
                    Mint
                  </button>
                </div>
              </div>

              <div className="card" style={{ background: "rgba(255,255,255,.03)", boxShadow: "none" }}>
                <div className="cardTitle">
                  <h2>Burn</h2>
                  <span className="pill">/stbchain.stablecoin.v1.MsgBurn</span>
                </div>

                <div className="form">
                  <div className="row">
                    <div className="kv">
                      <div className="k">Сжечь с адреса</div>
                      <div className="v">
                        {(burnTarget === "self" ? addressState : (STB as any).testRecipient) || "-"}
                      </div>
                    </div>

                    <div className="actions">
                      <button
                        className={`btn ${burnTarget === "self" ? "btnPrimary" : ""}`}
                        onClick={() => setBurnTarget("self")}
                        type="button"
                      >
                        Issuer
                      </button>

                      <button
                        className={`btn ${burnTarget === "test" ? "btnPrimary" : ""}`}
                        onClick={() => setBurnTarget("test")}
                        type="button"
                      >
                        Тест
                      </button>
                    </div>
                  </div>

                  <input
                    className="input"
                    placeholder="Сумма для Burn в STB (например 1)"
                    value={burnAmount}
                    onChange={(e) => setBurnAmount(e.target.value)}
                  />

                  <button className="btn btnDanger" onClick={handleBurn} disabled={!addressState}>
                    Burn
                  </button>

                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* History card */}
        <div className="card" style={{ gridColumn: "1 / -1" }}>
          <div className="cardTitle">
            <h2>История</h2>
            <span className="pill">{historyStatus || "-"}</span>
          </div>

          {history.length === 0 ? (
            <div className="help">Пока пусто. Нажми «Обновить историю» после отправки / mint / burn.</div>
          ) : (
            <div className="list">
              {history.map((tx) => {
                const kindLabel =
                  tx.kind === "send" ? "Отправка" : tx.kind === "receive" ? "Получение" : "Tx";
                const badgeClass =
                  tx.kind === "send" ? "badge badgeSend" : tx.kind === "receive" ? "badge badgeRecv" : "badge badgeOther";

                return (
                  <div key={tx.txhash} className="tx">
                    <div className="txLeft">
                      <div className="txTop">
                        <span className={badgeClass}>{kindLabel}</span>
                        <span className="small">#{tx.height}</span>
                      </div>
                      <div className="txMeta">With: {tx.counterparty || "-"}</div>
                      <div className="txHash">
                        {tx.txhash.slice(0, 10)}…{tx.txhash.slice(-8)}
                        {tx.timestamp ? ` • ${tx.timestamp}` : ""}
                      </div>
                    </div>
                    <div className="txRight">
                      <div className="txAmount">{tx.amountUstb ? formatUstb(tx.amountUstb) : "-"}</div>
                      <div className="small">denom: ustb</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}