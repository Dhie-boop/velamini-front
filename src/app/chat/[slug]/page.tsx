'use client';
import { useState, useRef, useEffect } from "react";
import { PaperPlaneIcon } from "@radix-ui/react-icons";
import FeedbackModal from "@/components/chat-ui/FeedbackModal";
import ChatNavbar from "@/components/chat-ui/ChatNavbar";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function SharedChatPage({ params }: PageProps) {
  // Get slug from params (App Router)
  const [slug, setSlug] = useState<string>("");
  useEffect(() => {
    (async () => {
      if (params && typeof params.then === "function") {
        const resolved = await params;
        setSlug(resolved.slug);
      } else if (params && typeof params === "object" && "slug" in params) {
        setSlug(typeof params.slug === "string" ? params.slug : "");
      }
    })();
  }, [params]);

  // State for virtual self info
  const [virtualSelf, setVirtualSelf] = useState<{ name: string; image?: string; userId?: string } | null>(null);
  // Store resolved userId for chat API
  const [virtualSelfId, setVirtualSelfId] = useState<string | null>(null);
  // Q&A pairs for this virtual self
  const [qaPairs, setQaPairs] = useState<Array<{ question: string; answer: string }>>([]);

  // Fetch userId and virtual self info using swag as slug
  useEffect(() => {
    if (!slug) return;
    fetch(`/api/swag/resolve?slug=${encodeURIComponent(slug)}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data && data.userId) {
          setVirtualSelfId(data.userId);
          setVirtualSelf({ name: data.name, image: data.image });
          fetch(`/api/knowledgebase/qa?userId=${data.userId}`)
            .then((res) => res.ok ? res.json() : null)
            .then((qaData) => {
              if (qaData && Array.isArray(qaData.qaPairs)) setQaPairs(qaData.qaPairs);
              else setQaPairs([]);
            });
        } else {
          setVirtualSelfId(null);
          setVirtualSelf(null);
          setQaPairs([]);
        }
      });
  }, [slug]);

  // Chat state and logic (copied from ChatPanel)
  const [input, setInput] = useState("");
  type Message = {
    id: number;
    role: "user" | "assistant";
    content: string;
  };
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`velamini_chat_history_${slug}`);
      if (saved) {
        setMessages(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Failed to load chat history", err);
    }
  }, [slug]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`velamini_chat_history_${slug}`, JSON.stringify(messages));
    } else {
      localStorage.removeItem(`velamini_chat_history_${slug}`);
    }
  }, [messages, slug]);

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

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      let recentHistory = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // If there is no chat history, preload knowledge and system prompt for backend use
      let useDefaultKnowledge = false;
      if (messages.length === 0) {
        useDefaultKnowledge = true;
      }

      // Wait for virtualSelfId to be resolved
      if (!virtualSelfId) {
        setIsTyping(false);
        return;
      }

      // Inject Q&A pairs into the context/system prompt for the AI
      let qaContext = "";
      if (qaPairs.length > 0) {
        qaContext = '\n\nUSER Q&A MEMORY (Recall these answers if asked similar questions):\n' + qaPairs.map(q => `Q: ${q.question}\nA: ${q.answer}`).join("\n\n");
      }

      const res = await fetch("/api/chat/shared", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: recentHistory,
          virtualSelfId: virtualSelfId,
          qaContext,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: data.text ?? data.error ?? "Sorry, something went wrong.",
        } as Message,
      ]);
    } catch (err) {
      console.error("Chat request failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: "I'm having connection issues right now…",
        } as Message,
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    localStorage.removeItem(`velamini_chat_history_${slug}`);
    setInput("");
  };

  interface ChatInputProps {
    input: string;
    setInput: React.Dispatch<React.SetStateAction<string>>;
    onSend: () => void;
    placeholder?: string;
  }

  function ChatInput({ input, setInput, onSend, placeholder }: ChatInputProps) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    };
    return (
      <div className="flex w-full gap-3 items-center p-4 sm:p-6 bg-zinc-900 rounded-lg shadow-lg border border-zinc-800">
        <input
          className="flex-1 px-4 py-4 sm:px-8 sm:py-6 bg-transparent text-zinc-100 placeholder-zinc-400 border-none focus:outline-none focus:ring-2 focus:ring-cyan-500/60 rounded-md text-lg sm:text-2xl transition"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Type a message..."}
          autoFocus
        />
        <button
          className="flex items-center justify-center p-4 sm:p-5 text-cyan-500 rounded-md bg-transparent hover:bg-transparent focus:bg-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-cyan-400"
          onClick={onSend}
          disabled={!input.trim()}
          aria-label="Send message"
        >
          <PaperPlaneIcon className="w-7 h-7 sm:w-8 sm:h-8" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex-1 min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {/* HUD grid background */}
      <div className="pointer-events-none absolute inset-0 hud-grid opacity-20" />

      {/* Floating particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-cyan-400 animate-float"
            style={{
              left: `${(i * 17) % 100}%`,
              top: `${(i * 29) % 100}%`,
              animationDelay: `${(i % 7) * 0.5}s`,
              animationDuration: `${3 + (i % 5)}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex h-screen">
        <main className="flex flex-1 flex-col">
          <div className="flex flex-1">
            <section className="flex-1 border-r border-gray-800/50">
              {/* Chat UI */}
              <div className="h-screen w-full flex flex-col bg-whitesmoke text-gray-100 font-sans overflow-hidden">
                <ChatNavbar
                  onShowFeedback={() => setShowFeedbackModal(true)}
                  onNewChat={handleNewChat}
                />

                <div
                  className={`flex-1 flex flex-col items-center px-1 sm:px-4 pt-3 sm:pt-6 pb-24 sm:pb-20 overflow-y-auto ${
                    messages.length === 0 ? "justify-center" : "justify-start"
                  }`}
                >
                  <div className="w-full max-w-full sm:max-w-3xl mx-auto flex flex-col min-h-full">
                    {messages.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {messages.map((msg, idx) => {
                          // DaisyUI bubble color logic
                          let bubbleClass = "chat-bubble chat-bubble-primary";
                          let avatar = "/logo.png";
                          let name = "You";
                          let time = new Date(msg.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          let footer = "Delivered";
                          if (msg.role === "assistant") {
                            const assistantColors = [
                              "chat-bubble-info",
                              "chat-bubble-success",
                             
                            ];
                            bubbleClass = `chat-bubble ${assistantColors[idx % assistantColors.length]}`;
                            avatar = virtualSelf?.image || "/logo.png";
                            name = virtualSelf?.name || "Virtual Self";
                            footer = `Seen at ${time}`;
                          } else {
                            const userColors = [
                              "chat-bubble-primary",
                              "chat-bubble-secondary",
                              
                            ];
                            bubbleClass = `chat-bubble ${userColors[idx % userColors.length]}`;
                          }
                          // Always show user messages on right, assistant on left
                          const isCurrentUser = msg.role === "user";
                          return (
                            <div
                              key={msg.id}
                              className={`chat ${isCurrentUser ? "chat-end" : "chat-start"}`}
                            >
                              <div className="chat-image avatar">
                                <div className="w-10 rounded-full">
                                  <img alt="Avatar" src={avatar} />
                                </div>
                              </div>
                              <div className="chat-header">
                                {name}
                                <time className="text-xs opacity-50">{time}</time>
                              </div>
                              <div className={bubbleClass}>{msg.content}</div>
                              <div className="chat-footer opacity-50">{footer}</div>
                            </div>
                          );
                        })}
                        {isTyping && virtualSelf && (
                          <div className="chat chat-start">
                            <div className="chat-image avatar">
                              <div className="w-10 rounded-full">
                                <img alt="Avatar" src={virtualSelf?.image || "/logo.png"} />
                              </div>
                            </div>
                            <div className="chat-header">
                              {virtualSelf?.name || "Virtual Self"}
                              <time className="text-xs opacity-50">...</time>
                            </div>
                            <div className="chat-bubble chat-bubble-info">Typing...</div>
                            <div className="chat-footer opacity-50">...</div>
                          </div>
                        )}
                        {!virtualSelf && (
                          <div className="chat chat-start">
                            <div className="chat-image avatar">
                              <div className="w-10 rounded-full">
                                <img alt="Avatar" src={"/logo.png"} />
                              </div>
                            </div>
                            <div className="chat-header">
                              Virtual Self
                              <time className="text-xs opacity-50">...</time>
                            </div>
                            <div className="chat-bubble chat-bubble-error">Virtual self not available.</div>
                            <div className="chat-footer opacity-50">...</div>
                          </div>
                        )}
                        <div ref={bottomRef} />
                      </div>
                    )}

                    {/* Input in the middle if new chat */}
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center flex-1">
                        <div className="w-full max-w-xl mx-auto">
                          <ChatInput
                            input={input}
                            setInput={setInput}
                            onSend={sendMessage}
                            placeholder="Ask anything..."
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="sticky bottom-0 pt-4 pb-6 bg-gradient-to-t from-gray-950 via-gray-950/90 to-transparent">
                        <ChatInput
                          input={input}
                          setInput={setInput}
                          onSend={sendMessage}
                          placeholder="Ask anything..."
                        />
                      </div>
                    )}
                  </div>
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
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
