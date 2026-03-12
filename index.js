import { useState, useRef, useEffect, useCallback } from "react";
import Head from "next/head";
import Header from "../components/Header";
import Message from "../components/Message";
import InputBar from "../components/InputBar";
import { parseCommand } from "../lib/parser";
import { login, createCIF, createDepositAccount, clearToken } from "../lib/api";
import styles from "./index.module.css";

// ─── Helpers ────────────────────────────────────────────────────────────────
function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

let msgIdCounter = 100;
function newId() { return ++msgIdCounter; }

const WELCOME_MSG = {
  id: 1,
  role: "bot",
  time: nowTime(),
  text:
    "Welcome to SBI CIF Management System 🏦\n\n" +
    "I can create CIF accounts using natural language commands.\n\n" +
    "Start by logging in:\n" +
    "  login as <username> password <password>\n\n" +
    "Type 'help' to see all available commands.",
};

// ─── Page ───────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [messages, setMessages]   = useState([WELCOME_MSG]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [loggedIn, setLoggedIn]   = useState(false);
  const [username, setUsername]   = useState("");
  const bottomRef                 = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Append a message
  const appendMsg = useCallback((role, text, extra = {}) => {
    const msg = { id: newId(), role, text, time: nowTime(), ...extra };
    setMessages((prev) => [...prev, msg]);
    return msg.id;
  }, []);

  // Replace the last typing indicator with real content
  const resolveTyping = useCallback((typingId, updates) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === typingId ? { ...m, typing: false, ...updates } : m))
    );
  }, []);

  // ─── Send handler ──────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setLoading(true);

    // User bubble
    appendMsg("user", text);

    // Typing indicator
    const typingId = newId();
    setMessages((prev) => [...prev, { id: typingId, role: "bot", typing: true, text: "", time: nowTime() }]);

    // Small delay for UX
    await new Promise((r) => setTimeout(r, 500));

    const cmd = parseCommand(text);
    let botText  = "";
    let botExtra = {};

    try {
      switch (cmd.type) {
        // ── GREET
        case "GREET":
          botText = "Hello! 👋 Type 'help' to see what I can do.";
          break;

        // ── HELP
        case "HELP":
          botText  = "";
          botExtra = { isHelp: true };
          break;

        // ── LOGIN
        case "LOGIN": {
          resolveTyping(typingId, { text: `Authenticating as "${cmd.username}"…` });
          await new Promise((r) => setTimeout(r, 400));
          await login(cmd.username, cmd.password);
          setLoggedIn(true);
          setUsername(cmd.username);
          botText = `✅ Logged in successfully as "${cmd.username}"!\n\nYou can now create CIF accounts.\nTry: "create a CIF for K region"`;
          break;
        }

        // ── LOGOUT
        case "LOGOUT":
          clearToken();
          setLoggedIn(false);
          setUsername("");
          botText = "👋 Logged out. See you next time!";
          break;

        // ── CREATE CIF
        case "CREATE_CIF": {
          if (!loggedIn) {
            botText = "⚠️ You need to login first.\n\nUse: login as <username> password <password>";
            break;
          }
          const { payload } = cmd;
          const preview = `📋 Creating ${payload.no_cif} ${payload.acc_type} for region "${payload.region}"…`;
          resolveTyping(typingId, { text: preview });
          await new Promise((r) => setTimeout(r, 500));

          const result = await createCIF(payload);
          botText  = `✅ ${result.length} CIF(s) created for region "${payload.region}":`;
          botExtra = { cifData: result };
          break;
        }

        // ── CREATE DEPOSIT ACCOUNT
        case "CREATE_DEPOSIT_ACCOUNT": {
          if (!loggedIn) {
            botText = "⚠️ You need to login first.\n\nUse: login as <username> password <password>";
            break;
          }
          const { payload } = cmd;
          resolveTyping(typingId, { text: "📋 Creating deposit account…" });
          await new Promise((r) => setTimeout(r, 500));

          const result = await createDepositAccount(payload);
          botText = "✅ Deposit account created.";
          if (Array.isArray(result) && result.length > 0) botExtra = { cifData: result };
          break;
        }

        // ── UNKNOWN
        default:
          botText =
            "❓ I didn't understand that.\n\n" +
            "Type 'help' to see available commands, or try:\n" +
            "  create a CIF for K region";
      }
    } catch (err) {
      botText = `❌ Error: ${err.message}`;
    }

    resolveTyping(typingId, { text: botText, ...botExtra });
    setLoading(false);
  }, [input, loading, loggedIn, appendMsg, resolveTyping]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>SBI CIF Assistant</title>
        <meta name="description" content="SBI CIF Management Chatbot" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.page}>
        {/* Ambient glows */}
        <div className={styles.glowGreen} />
        <div className={styles.glowBlue} />

        <div className={styles.window}>
          {/* Header */}
          <Header loggedIn={loggedIn} username={username} />

          {/* Messages */}
          <div className={styles.messages}>
            {messages.map((msg) => (
              <Message key={msg.id} msg={msg} />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <InputBar
            value={input}
            onChange={setInput}
            onSend={handleSend}
            loading={loading}
            loggedIn={loggedIn}
          />
        </div>
      </div>
    </>
  );
}
