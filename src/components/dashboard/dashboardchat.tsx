"use client";

import { useState, useRef, useEffect } from "react";
import { PaperPlaneIcon } from "@radix-ui/react-icons";
import { User as UserIcon } from "lucide-react";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

// import { getAISystemPrompt } from "@/lib/ai-config";

interface DashboardChatProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  knowledgeBase?: any; // Now used for persona
}

function ChatInput({
  input,
  setInput,
  onSend,
  placeholder,
}: {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  onSend: () => void | Promise<void>;
  placeholder?: string;
}) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex w-full gap-2 items-center bg-transparent">
      <div className="flex-1 flex items-center bg-base-200 rounded-2xl px-4 py-3 shadow-md border border-base-300 focus-within:ring-2 focus-within:ring-primary">
        <input
          className="flex-1 bg-transparent text-base-content placeholder-base-content/60 focus:outline-none text-lg font-medium"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Type a message..."}
          autoFocus
        />
        <button
          className="ml-2 p-2 rounded-full bg-primary text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all border-none outline-none"
          onClick={onSend}
          disabled={!input.trim()}
          aria-label="Send"
          type="button"
        >
          <PaperPlaneIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

function DashboardChat({ user, knowledgeBase }: DashboardChatProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // New chat handler
  const handleNewChat = () => {
    setMessages([]);
    localStorage.removeItem("velamini_dashboard_chat_history");
    setInput("");
  };

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("velamini_dashboard_chat_history");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to parse dashboard chat history:", err);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("velamini_dashboard_chat_history", JSON.stringify(messages));
    } else {
      localStorage.removeItem("velamini_dashboard_chat_history");
    }
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: input.trim(),
    };

    // Detect if last assistant message was a question
    const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
    const lastQuestion = lastAssistantMsg && /\?$/.test(lastAssistantMsg.content.trim()) ? lastAssistantMsg.content.trim() : null;

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // If last message was a question, save Q&A pair
    if (lastQuestion && userMessage.content.length > 1 && user?.name) {
      fetch("/api/knowledgebase/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: lastQuestion, answer: userMessage.content }),
      }).catch((err) => console.error("Failed to save Q&A:", err));
    }

    try {
      const recentHistory = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Custom system prompt for dashboard: AI is user's digital twin being trained
      const systemPrompt = `You are a digital twin (virtual self) being trained by the user. The user is ${user?.name || "the person"}.
    You must ALWAYS answer as if you are being trained by the user, who is your creator. NEVER say you don't know the user. ALWAYS refer to them as your trainer or creator.
    Every answer must acknowledge the user as your creator/trainer, and you must never claim to be a stranger or not know them.
    Your name is ${user?.name || "the person"}. When asked for your name, always say: 'My name is ${user?.name || "the person"}, because I am your digital twin.'
    Always answer in simple, concise words unless the user asks for more detail.
    Example: 'Thank you for teaching me, ${user?.name || "the person"}! As your digital twin, I will remember this.' or 'As your virtual self, I am here to learn from you and represent you.'`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: recentHistory,
          knowledgeBase: knowledgeBase || null,
          systemPrompt,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.reply ?? data.text ?? data.message ?? "Sorry, I couldn't generate a response.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Chat request failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: "Sorry, there was a connection issue. Please try again.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const avatarSrc = user?.image || "/logo.png"; // fallback same for user & assistant

  return (
    <div className="relative flex-1 min-h-screen overflow-hidden bg-base-100 text-base-content">
      {/* New Chat Button */}
      <div className="absolute top-4 right-4 z-20">
        <button
          className="btn btn-primary"
          onClick={handleNewChat}
        >
          New Chat
        </button>
      </div>
      {/* HUD grid background */}
      <div className="pointer-events-none absolute inset-0 hud-grid opacity-20" />

      {/* Floating particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-primary animate-float"
            style={{
              left: `${(i * 17) % 100}%`,
              top: `${(i * 29) % 100}%`,
              animationDelay: `${(i % 7) * 0.5}s`,
              animationDuration: `${3 + (i % 5)}s`,
            }}
          />
        ))}
      </div>

      <div className="flex flex-col h-screen w-full items-center justify-center bg-transparent relative z-10">
        <div className="w-full max-w-2xl h-[90vh] flex flex-col bg-base-200 rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 flex items-center gap-3 border-b border-base-300">
            <img
              src={avatarSrc}
              alt="Avatar"
              className="w-10 h-10 rounded-full border-2 border-primary shadow-sm object-cover"
            />
            <div>
              <div className="font-semibold text-lg text-base-content">
                {user?.name || "Velamini Dashboard"}
              </div>
              <div className="text-xs text-base-content/60">
                AI Assistant
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full opacity-70 select-none">
                <img
                  src="/logo.png"
                  alt="Assistant"
                  className="w-20 h-20 mb-5 rounded-full shadow-lg"
                />
                <div className="text-xl font-medium text-base-content mb-2">
                  Start a conversation
                </div>
                <div className="text-sm text-base-content/60">
                  How can I help you today?
                </div>
              </div>
            )}

            {messages.map((msg) => {
              const isUser = msg.role === "user";
              let bubbleClass = isUser
                ? "chat-bubble chat-bubble-primary text-base-content"
                : "chat-bubble bg-accent text-accent-content";
              let avatar: React.ReactNode = null;
              if (isUser) {
                avatar = <UserIcon className="w-8 h-8 text-primary" />;
              } else {
                avatar = user?.image ? (
                  <img alt="Avatar" src={user.image} />
                ) : (
                  <UserIcon className="w-8 h-8 text-accent" />
                );
              }
              let name = isUser ? "You" : user?.name || "AI Assistant";
              let time = new Date(msg.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              let footer = isUser ? "Delivered" : `Seen at ${time}`;
              return (
                <div key={msg.id} className={`chat ${isUser ? "chat-end" : "chat-start"}`}>
                  <div className="chat-image avatar">
                    <div className="w-10 h-10 rounded-full bg-base-100 border border-base-300 flex items-center justify-center overflow-hidden">
                      {avatar}
                    </div>
                  </div>
                  <div className="chat-header text-base-content">
                    {name}
                    <time className="text-xs opacity-50">{time}</time>
                  </div>
                  <div className={bubbleClass}>{msg.content}</div>
                  <div className="chat-footer opacity-50 text-base-content/60">{footer}</div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex justify-start items-end mb-5">
                <img
                  src="/logo.png"
                  alt="Assistant"
                  className="w-8 h-8 rounded-full mr-2 shadow-sm border border-primary"
                />
                <div className="px-4 py-3 rounded-2xl bg-base-100 border border-base-300 rounded-bl-none">
                  <div className="flex gap-1.5 items-center h-6">
                    <div className="w-2.5 h-2.5 bg-base-content rounded-full animate-bounce [animation-delay:0ms]"></div>
                    <div className="w-2.5 h-2.5 bg-base-content rounded-full animate-bounce [animation-delay:180ms]"></div>
                    <div className="w-2.5 h-2.5 bg-base-content rounded-full animate-bounce [animation-delay:360ms]"></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="px-6 py-4 mt-3">
            <ChatInput
              input={input}
              setInput={setInput}
              onSend={sendMessage}
              placeholder="Ask anything..."
            />
          </div>
        </div>
      </div>

      {/* Optional global styles – better to move to globals.css or component CSS module */}
      <style jsx global>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(1); }
          40% { transform: scale(1.35); }
        }
        .animate-bounce {
          animation: bounce 1.3s infinite;
        }
        @keyframes float {
          0% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .hud-grid {
          background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>
    </div>
  );
}

export default DashboardChat;