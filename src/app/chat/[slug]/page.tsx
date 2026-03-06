'use client';
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, AlertCircle, RefreshCw, Moon, Sun, MessageSquarePlus, Sparkles } from "lucide-react";
import FeedbackModal from "@/components/chat-ui/FeedbackModal";
import ChatNavbar from "@/components/chat-ui/ChatNavbar";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface ChatInputProps {
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  isTyping: boolean;
  placeholder?: string;
}

function ChatInput({ input, setInput, onSend, isTyping, placeholder }: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };
  const isDisabled = !input.trim() || isTyping;

  return (
    <div className="chat-input-wrapper">
      <div className="chat-input-inner">
        <textarea
          className="chat-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Type a message...'}
          rows={1}
        />
        <button
          className={`send-btn ${isDisabled ? 'send-btn--disabled' : 'send-btn--active'}`}
          onClick={onSend}
          disabled={isDisabled}
          aria-label="Send message"
        >
          {isTyping
            ? <Loader2 className="icon spin" />
            : <Send className="icon" />
          }
        </button>
      </div>
      <style>{`
        .chat-input-wrapper {
          width: 100%;
          padding: 4px;
          background: linear-gradient(135deg, var(--c-border), transparent 60%);
          border-radius: 18px;
        }
        .chat-input-inner {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          padding: 12px 14px;
          background: var(--c-surface);
          border-radius: 15px;
          border: 1px solid var(--c-border);
          transition: border-color 0.2s;
        }
        .chat-input-inner:focus-within {
          border-color: var(--c-accent);
        }
        .chat-textarea {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          resize: none;
          min-height: 22px;
          max-height: 140px;
          font-family: var(--font-body);
          font-size: 0.9rem;
          line-height: 1.55;
          color: var(--c-text);
        }
        .chat-textarea::placeholder { color: var(--c-muted); }
        .send-btn {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .send-btn--disabled {
          background: var(--c-border);
          color: var(--c-muted);
          cursor: not-allowed;
        }
        .send-btn--active {
          background: var(--c-accent);
          color: #fff;
        }
        .send-btn--active:hover {
          background: var(--c-accent-dim);
          transform: scale(1.06);
        }
        .icon { width: 15px; height: 15px; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function SharedChatPage({ params }: PageProps) {
  const [slug, setSlug] = useState<string>("");
  useEffect(() => {
    (async () => {
      if (params && typeof (params as unknown as Promise<{slug:string}>).then === "function") {
        const resolved = await (params as unknown as Promise<{slug:string}>);
        setSlug(resolved.slug);
      } else if (params && "slug" in params) {
        setSlug(typeof (params as {slug:string}).slug === "string" ? (params as {slug:string}).slug : "");
      }
    })();
  }, [params]);

  const [virtualSelf, setVirtualSelf] = useState<{ name: string; image?: string } | null>(null);
  const [virtualSelfId, setVirtualSelfId] = useState<string | null>(null);
  const [qaPairs, setQaPairs] = useState<Array<{ question: string; answer: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(`/api/swag/resolve?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) throw new Error('Failed to load virtual self');
        const data = await res.json();
        if (data?.userId) {
          setVirtualSelfId(data.userId);
          setVirtualSelf({ name: data.name, image: data.image });
          const qaRes = await fetch(`/api/knowledgebase/qa?userId=${data.userId}`);
          if (qaRes.ok) {
            const qaData = await qaRes.json();
            setQaPairs(Array.isArray(qaData.qaPairs) ? qaData.qaPairs : []);
          }
        } else throw new Error('Virtual self not found');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
        setVirtualSelfId(null);
        setVirtualSelf(null);
        setQaPairs([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [slug]);

  const [input, setInput] = useState("");
  type Message = {
    id: number; role: "user" | "assistant"; content: string;
    status?: "sending" | "sent" | "failed"; timestamp?: Date;
  };
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [retryMessage, setRetryMessage] = useState<Message | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
    const dark = theme === 'dark' || (!theme && prefersDark);
    setIsDarkMode(dark);
    document.documentElement.setAttribute('data-mode', dark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    document.documentElement.setAttribute('data-mode', next ? 'dark' : 'light');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`velamini_chat_history_${slug}`);
      if (saved) setMessages(JSON.parse(saved));
    } catch {}
  }, [slug]);

  useEffect(() => {
    if (messages.length > 0)
      localStorage.setItem(`velamini_chat_history_${slug}`, JSON.stringify(messages));
    else
      localStorage.removeItem(`velamini_chat_history_${slug}`);
  }, [messages, slug]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (messageToRetry?: Message) => {
    const content = messageToRetry?.content || input.trim();
    if (!content) return;

    const userMessage: Message = messageToRetry || {
      id: Date.now(), role: "user", content, status: "sending", timestamp: new Date(),
    };

    if (!messageToRetry) {
      setMessages(prev => [...prev, userMessage]);
      setInput("");
    } else {
      setMessages(prev => prev.map(m => m.id === messageToRetry.id ? { ...m, status: "sending" } : m));
    }

    setIsTyping(true);
    setRetryMessage(null);

    try {
      const recentHistory = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));

      if (!virtualSelfId) {
        setMessages(prev => prev.map(m => m.id === userMessage.id ? { ...m, status: "failed" } : m));
        setRetryMessage(userMessage);
        setIsTyping(false);
        return;
      }

      const qaContext = qaPairs.length > 0
        ? '\n\nUSER Q&A MEMORY:\n' + qaPairs.map(q => `Q: ${q.question}\nA: ${q.answer}`).join("\n\n")
        : "";

      const res = await fetch("/api/chat/shared", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content, history: recentHistory, virtualSelfId, qaContext }),
      });

      const data = await res.json();

      setMessages(prev => prev.map(m => m.id === userMessage.id ? { ...m, status: "sent" } : m));
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: "assistant",
        content: data.text ?? data.error ?? "Sorry, something went wrong.",
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => prev.map(m => m.id === userMessage.id ? { ...m, status: "failed" } : m));
      setRetryMessage(userMessage);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    localStorage.removeItem(`velamini_chat_history_${slug}`);
    setInput("");
  };

  const hasMessages = messages.length > 0;

  return (
    <>
      <style>{`
        /* ── Design tokens ── */
        :root, [data-mode="light"] {
          --c-bg:         #F7F5F2;
          --c-surface:    #FFFFFF;
          --c-surface-2:  #F0EDE8;
          --c-border:     #E4DED6;
          --c-text:       #1A1714;
          --c-muted:      #9A9189;
          --c-accent:     #C4622D;
          --c-accent-dim: #A0501F;
          --c-user-bg:    #1A1714;
          --c-user-text:  #F7F5F2;
          --c-bot-bg:     #FFFFFF;
          --c-bot-text:   #1A1714;
          --font-display: 'DM Serif Display', Georgia, serif;
          --font-body:    'DM Sans', system-ui, sans-serif;
          --shadow-sm:    0 1px 4px rgba(0,0,0,0.06);
          --shadow-md:    0 4px 24px rgba(0,0,0,0.08);
        }
        [data-mode="dark"] {
          --c-bg:         #111010;
          --c-surface:    #1C1B1A;
          --c-surface-2:  #252322;
          --c-border:     #2E2C2A;
          --c-text:       #EDE9E4;
          --c-muted:      #6B6560;
          --c-accent:     #E07040;
          --c-accent-dim: #C45A28;
          --c-user-bg:    #E07040;
          --c-user-text:  #FFF;
          --c-bot-bg:     #252322;
          --c-bot-text:   #EDE9E4;
          --shadow-sm:    0 1px 4px rgba(0,0,0,0.3);
          --shadow-md:    0 4px 24px rgba(0,0,0,0.4);
        }

        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: var(--font-body);
          background: var(--c-bg);
          color: var(--c-text);
          transition: background 0.3s, color 0.3s;
        }

        /* ── Layout ── */
        .page { display: flex; flex-direction: column; height: 100dvh; overflow: hidden; background: var(--c-bg); }

        /* ── Navbar ── */
        .navbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 20px;
          background: var(--c-surface);
          border-bottom: 1px solid var(--c-border);
          gap: 12px;
          flex-shrink: 0;
        }
        .navbar-brand {
          display: flex; align-items: center; gap: 10px;
        }
        .navbar-logo {
          width: 28px; height: 28px; border-radius: 8px;
          background: var(--c-accent); display: flex; align-items: center; justify-content: center;
        }
        .navbar-logo svg { width: 14px; height: 14px; color: #fff; }
        .navbar-title {
          font-family: var(--font-display);
          font-size: 1.05rem;
          color: var(--c-text);
          letter-spacing: -0.01em;
        }
        .navbar-actions { display: flex; align-items: center; gap: 6px; }
        .icon-btn {
          display: flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 9px;
          border: 1px solid var(--c-border);
          background: var(--c-surface-2);
          color: var(--c-muted);
          cursor: pointer;
          transition: all 0.18s;
        }
        .icon-btn:hover { color: var(--c-text); border-color: var(--c-accent); background: var(--c-surface); }
        .icon-btn svg { width: 15px; height: 15px; }

        /* ── Loading overlay ── */
        .overlay {
          position: fixed; inset: 0; z-index: 50;
          display: flex; align-items: center; justify-content: center;
          background: color-mix(in srgb, var(--c-bg) 85%, transparent);
          backdrop-filter: blur(6px);
        }
        .overlay-card {
          display: flex; flex-direction: column; align-items: center; gap: 14px;
          padding: 36px 40px;
          background: var(--c-surface);
          border: 1px solid var(--c-border);
          border-radius: 20px;
          box-shadow: var(--shadow-md);
          text-align: center;
        }
        .overlay-spinner { color: var(--c-accent); animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .overlay-title { font-family: var(--font-display); font-size: 1.1rem; color: var(--c-text); }
        .overlay-sub { font-size: 0.8rem; color: var(--c-muted); margin-top: 2px; }

        /* ── Error card ── */
        .error-icon-wrap {
          width: 54px; height: 54px; border-radius: 50%;
          background: color-mix(in srgb, #E53E3E 12%, transparent);
          display: flex; align-items: center; justify-content: center;
          color: #E53E3E;
        }
        .retry-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 18px; border-radius: 10px;
          background: var(--c-accent); color: #fff;
          border: none; cursor: pointer; font-size: 0.85rem;
          font-family: var(--font-body);
          transition: background 0.18s, transform 0.18s;
        }
        .retry-btn:hover { background: var(--c-accent-dim); transform: scale(1.03); }

        /* ── Welcome ── */
        .welcome {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 32px 20px; overflow-y: auto;
        }
        .welcome-inner { width: 100%; max-width: 480px; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .avatar-wrap { position: relative; margin-bottom: 20px; }
        .avatar-img {
          width: 80px; height: 80px; border-radius: 50%;
          border: 3px solid var(--c-border);
          object-fit: cover;
          box-shadow: var(--shadow-md);
          background: var(--c-surface-2);
        }
        .online-dot {
          position: absolute; bottom: 2px; right: 2px;
          width: 14px; height: 14px; border-radius: 50%;
          background: #38A169;
          border: 2.5px solid var(--c-bg);
        }
        .welcome-name {
          font-family: var(--font-display);
          font-size: 1.75rem; font-weight: 400;
          letter-spacing: -0.02em;
          color: var(--c-text); margin-bottom: 6px;
        }
        .welcome-sub { font-size: 0.82rem; color: var(--c-muted); margin-bottom: 28px; letter-spacing: 0.04em; text-transform: uppercase; }
        .welcome-divider {
          width: 36px; height: 1.5px; background: var(--c-accent);
          border-radius: 2px; margin: 0 auto 28px;
        }

        /* ── Conversation ── */
        .conversation { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .message-list {
          flex: 1; overflow-y: auto; padding: 24px 20px;
          display: flex; flex-direction: column; align-items: center;
          scrollbar-width: thin; scrollbar-color: var(--c-border) transparent;
        }
        .message-list::-webkit-scrollbar { width: 4px; }
        .message-list::-webkit-scrollbar-thumb { background: var(--c-border); border-radius: 4px; }
        .messages-inner { width: 100%; max-width: 600px; display: flex; flex-direction: column; gap: 16px; padding-bottom: 8px; }

        /* ── Message row ── */
        .msg-row { display: flex; align-items: flex-end; gap: 10px; }
        .msg-row--user { flex-direction: row-reverse; }
        .msg-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          object-fit: cover; flex-shrink: 0;
          border: 1.5px solid var(--c-border);
          background: var(--c-surface-2);
        }
        .msg-content { display: flex; flex-direction: column; gap: 4px; max-width: 75%; }
        .msg-row--user .msg-content { align-items: flex-end; }
        .msg-meta { display: flex; align-items: center; gap: 6px; }
        .msg-name { font-size: 0.72rem; font-weight: 500; color: var(--c-muted); letter-spacing: 0.02em; }
        .msg-time { font-size: 0.68rem; color: color-mix(in srgb, var(--c-muted) 70%, transparent); }
        .msg-bubble {
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 0.875rem;
          line-height: 1.6;
          box-shadow: var(--shadow-sm);
        }
        .msg-bubble--user {
          background: var(--c-user-bg);
          color: var(--c-user-text);
          border-bottom-right-radius: 5px;
        }
        .msg-bubble--bot {
          background: var(--c-bot-bg);
          color: var(--c-bot-text);
          border: 1px solid var(--c-border);
          border-bottom-left-radius: 5px;
        }
        .msg-bubble--failed { opacity: 0.6; }

        /* ── Typing indicator ── */
        .typing-dots { display: flex; align-items: center; gap: 4px; height: 16px; padding: 0 4px; }
        .dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--c-muted);
          animation: bounce 0.9s ease-in-out infinite;
        }
        .dot:nth-child(2) { animation-delay: 0.15s; }
        .dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes bounce { 0%,80%,100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }

        /* ── Input bar ── */
        .input-bar {
          border-top: 1px solid var(--c-border);
          background: var(--c-surface);
          padding: 14px 20px;
          display: flex; justify-content: center;
        }
        .input-bar-inner { width: 100%; max-width: 600px; }

        /* ── Scrollbar ── */
        .message-list { scroll-behavior: smooth; }
      `}</style>

      <div className="page">
        {/* Loading overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="overlay-card">
                <Loader2 size={28} className="overlay-spinner" />
                <div>
                  <p className="overlay-title">One moment…</p>
                  <p className="overlay-sub">Waking up your virtual self</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error overlay */}
        <AnimatePresence>
          {error && !isLoading && (
            <motion.div className="overlay" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="overlay-card">
                <div className="error-icon-wrap">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <p className="overlay-title">Something went wrong</p>
                  <p className="overlay-sub" style={{ marginBottom: 16 }}>{error}</p>
                  <button className="retry-btn" onClick={() => window.location.reload()}>
                    <RefreshCw size={13} /> Try again
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navbar */}
        <nav className="navbar">
          <div className="navbar-brand">
            <div className="navbar-logo"><Sparkles size={14} /></div>
            <span className="navbar-title">
              {virtualSelf?.name ?? 'Virtual Self'}
            </span>
          </div>
          <div className="navbar-actions">
            <button className="icon-btn" onClick={handleNewChat} title="New chat">
              <MessageSquarePlus size={15} />
            </button>
            <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </nav>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            {!hasMessages ? (
              /* Welcome */
              <motion.div
                key="welcome"
                className="welcome"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                {!isLoading && !error && virtualSelf && (
                  <div className="welcome-inner">
                    <motion.div
                      className="avatar-wrap"
                      initial={{ scale: 0.82, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.05 }}
                    >
                      <img
                        src={virtualSelf.image || "/logo.png"}
                        alt={virtualSelf.name}
                        className="avatar-img"
                      />
                      <div className="online-dot" />
                    </motion.div>

                    <motion.h1
                      className="welcome-name"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 }}
                    >
                      {virtualSelf.name}
                    </motion.h1>

                    <motion.p
                      className="welcome-sub"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.18 }}
                    >
                      Available now
                    </motion.p>

                    <motion.div
                      className="welcome-divider"
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ delay: 0.24 }}
                    />

                    <motion.div
                      style={{ width: '100%' }}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <ChatInput
                        input={input}
                        setInput={setInput}
                        onSend={sendMessage}
                        isTyping={isTyping}
                        placeholder={`Ask ${virtualSelf.name} anything…`}
                      />
                    </motion.div>
                  </div>
                )}
              </motion.div>
            ) : (
              /* Conversation */
              <motion.div
                key="conversation"
                className="conversation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.22 }}
              >
                <div className="message-list">
                  <div className="messages-inner">
                    {messages.map((msg, i) => {
                      const isUser = msg.role === "user";
                      const avatar = isUser ? "/logo.png" : (virtualSelf?.image || "/logo.png");
                      const name = isUser ? "You" : (virtualSelf?.name || "Assistant");
                      const time = msg.timestamp
                        ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : new Date(msg.id).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                      return (
                        <motion.div
                          key={msg.id}
                          className={`msg-row ${isUser ? 'msg-row--user' : ''}`}
                          initial={{ opacity: 0, y: 14, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ type: "spring", stiffness: 340, damping: 26, delay: i === messages.length - 1 ? 0 : 0 }}
                        >
                          <img src={avatar} alt={name} className="msg-avatar" />
                          <div className="msg-content">
                            <div className="msg-meta">
                              {!isUser && <span className="msg-name">{name}</span>}
                              <span className="msg-time">{time}</span>
                              {isUser && <span className="msg-name">You</span>}
                            </div>
                            <div className={`msg-bubble ${isUser ? 'msg-bubble--user' : 'msg-bubble--bot'} ${msg.status === 'failed' ? 'msg-bubble--failed' : ''}`}>
                              {msg.content}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Typing */}
                    <AnimatePresence>
                      {isTyping && (
                        <motion.div
                          className="msg-row"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                        >
                          <img src={virtualSelf?.image || "/logo.png"} alt="typing" className="msg-avatar" />
                          <div className="msg-content">
                            <div className="msg-bubble msg-bubble--bot">
                              <div className="typing-dots">
                                <div className="dot" />
                                <div className="dot" />
                                <div className="dot" />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div ref={bottomRef} />
                  </div>
                </div>

                <div className="input-bar">
                  <div className="input-bar-inner">
                    <ChatInput
                      input={input}
                      setInput={setInput}
                      onSend={sendMessage}
                      isTyping={isTyping}
                      placeholder={virtualSelf ? `Message ${virtualSelf.name}…` : "Type a message…"}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          rating={rating}
          setRating={setRating}
          feedbackText={feedbackText}
          setFeedbackText={setFeedbackText}
        />
      </div>
    </>
  );
}