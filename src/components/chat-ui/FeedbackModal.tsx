"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Star } from "lucide-react";
import { useState } from "react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  rating: number;
  setRating: (value: number) => void;
  feedbackText: string;
  setFeedbackText: (value: string) => void;
  virtualSelfSlug?: string;
}

const EMOJIS = [
  { emoji: "😭", value: 1, label: "Terrible" },
  { emoji: "☹️", value: 2, label: "Bad" },
  { emoji: "😐", value: 3, label: "Okay" },
  { emoji: "🙂", value: 4, label: "Good" },
  { emoji: "🤩", value: 5, label: "Amazing" },
];

export default function FeedbackModal({
  isOpen, onClose, rating, setRating, feedbackText, setFeedbackText, virtualSelfSlug,
}: FeedbackModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    setErrorStatus(null);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: feedbackText, virtualSelfSlug }),
      });
      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setRating(0); setFeedbackText(""); setSubmitted(false); onClose();
        }, 1800);
      } else {
        const data = await response.json().catch(() => ({}));
        setErrorStatus(data.error || "Submission failed");
      }
    } catch {
      setErrorStatus("Connection error. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEmoji = EMOJIS.find(e => e.value === rating);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Lora:wght@400;600&display=swap');

        .fm-backdrop {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(8, 20, 32, 0.65);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }
        .fm-box {
          width: 100%; max-width: 440px;
          background: var(--c-surface, #fff);
          border: 1px solid var(--c-border, #C5DCF2);
          border-radius: 24px;
          box-shadow: 0 24px 64px rgba(8,20,32,0.18);
          overflow: hidden;
          position: relative;
        }

        /* Top accent strip */
        .fm-strip {
          height: 4px;
          background: linear-gradient(90deg, var(--c-accent, #29A9D4), #7DD3FC);
        }

        .fm-body { padding: 28px 28px 24px; }

        /* Close */
        .fm-close {
          position: absolute; top: 16px; right: 16px;
          width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid var(--c-border, #C5DCF2);
          background: var(--c-surface-2, #E2F0FC);
          color: var(--c-muted, #7399BA);
          cursor: pointer; transition: all 0.15s;
        }
        .fm-close:hover { color: var(--c-text, #0B1E2E); border-color: var(--c-text, #0B1E2E); }

        /* Header */
        .fm-title {
          font-family: 'Lora', Georgia, serif;
          font-size: 1.3rem; font-weight: 600;
          color: var(--c-text, #0B1E2E);
          letter-spacing: -0.01em;
          margin-bottom: 4px;
        }
        .fm-sub { font-size: 0.8rem; color: var(--c-muted, #7399BA); margin-bottom: 24px; }

        /* Emoji row */
        .fm-emojis {
          display: flex; gap: 8px; margin-bottom: 8px;
        }
        .fm-emoji-btn {
          flex: 1; aspect-ratio: 1;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 4px;
          border-radius: 14px;
          border: 1.5px solid var(--c-border, #C5DCF2);
          background: var(--c-surface-2, #E2F0FC);
          cursor: pointer; transition: all 0.18s;
          font-size: 1.5rem;
        }
        .fm-emoji-btn:hover:not(:disabled) {
          border-color: var(--c-accent, #29A9D4);
          background: var(--c-accent-soft, #DDF1FA);
          transform: translateY(-2px);
        }
        .fm-emoji-btn--active {
          border-color: var(--c-accent, #29A9D4) !important;
          background: var(--c-accent-soft, #DDF1FA) !important;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--c-accent, #29A9D4) 20%, transparent);
          transform: translateY(-3px) scale(1.06) !important;
        }
        .fm-emoji-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .fm-emoji-lbl { font-size: 0.58rem; font-weight: 600; color: var(--c-muted, #7399BA); letter-spacing: 0.04em; text-transform: uppercase; }
        .fm-emoji-btn--active .fm-emoji-lbl { color: var(--c-accent, #29A9D4); }

        /* Rating label */
        .fm-rating-line {
          height: 20px; margin-bottom: 20px;
          font-size: 0.78rem; font-weight: 600;
          color: var(--c-accent, #29A9D4);
          text-align: center; letter-spacing: 0.02em;
        }

        /* Textarea */
        .fm-label { font-size: 0.8rem; font-weight: 600; color: var(--c-text, #0B1E2E); margin-bottom: 8px; display: block; }
        .fm-label span { font-weight: 400; color: var(--c-muted, #7399BA); margin-left: 4px; }
        .fm-textarea {
          width: 100%; min-height: 110px;
          padding: 12px 14px;
          background: var(--c-surface-2, #E2F0FC);
          border: 1.5px solid var(--c-border, #C5DCF2);
          border-radius: 12px;
          resize: none; outline: none;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-size: 0.855rem; line-height: 1.6;
          color: var(--c-text, #0B1E2E);
          transition: border-color 0.18s, box-shadow 0.18s;
          margin-bottom: 20px;
        }
        .fm-textarea::placeholder { color: var(--c-muted, #7399BA); }
        .fm-textarea:focus {
          border-color: var(--c-accent, #29A9D4);
          box-shadow: 0 0 0 3px var(--c-accent-soft, #DDF1FA);
        }
        .fm-textarea:disabled { opacity: 0.5; }

        /* Error */
        .fm-error { font-size: 0.78rem; color: #E53E3E; text-align: center; margin-bottom: 10px; font-weight: 500; }

        /* Submit */
        .fm-submit {
          width: 100%; height: 44px; border-radius: 12px; border: none;
          background: var(--c-accent, #29A9D4); color: #fff;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-size: 0.88rem; font-weight: 700;
          cursor: pointer; transition: background 0.18s, transform 0.18s, opacity 0.18s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .fm-submit:hover:not(:disabled) { background: var(--c-accent-dim, #1D8BB2); transform: scale(1.02); }
        .fm-submit:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

        /* Success state */
        .fm-success {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 12px; padding: 48px 28px; text-align: center;
        }
        .fm-success-icon {
          width: 60px; height: 60px; border-radius: 50%;
          background: var(--c-accent-soft, #DDF1FA);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.8rem;
        }
        .fm-success-title { font-family: 'Lora', serif; font-size: 1.2rem; font-weight: 600; color: var(--c-text, #0B1E2E); }
        .fm-success-sub { font-size: 0.8rem; color: var(--c-muted, #7399BA); }

        .fm-spin { animation: fmspin 1s linear infinite; }
        @keyframes fmspin { to { transform: rotate(360deg); } }
      `}</style>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isSubmitting ? onClose : undefined}
          >
            <motion.div
              className="fm-box"
              initial={{ opacity: 0, scale: 0.93, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 24 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="fm-strip" />

              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    className="fm-success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  >
                    <div className="fm-success-icon">🎉</div>
                    <p className="fm-success-title">Thanks for your feedback!</p>
                    <p className="fm-success-sub">Your input helps us improve the experience.</p>
                  </motion.div>
                ) : (
                  <motion.div key="form" className="fm-body" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {!isSubmitting && (
                      <button className="fm-close" onClick={onClose}>
                        <X size={14} />
                      </button>
                    )}

                    <p className="fm-title">Share your feedback</p>
                    <p className="fm-sub">How was your experience talking with this virtual self?</p>

                    {/* Emoji picker */}
                    <div className="fm-emojis">
                      {EMOJIS.map(item => (
                        <button
                          key={item.value}
                          className={`fm-emoji-btn ${rating === item.value ? 'fm-emoji-btn--active' : ''}`}
                          onClick={() => setRating(item.value)}
                          disabled={isSubmitting}
                        >
                          <span>{item.emoji}</span>
                          <span className="fm-emoji-lbl">{item.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Rating label */}
                    <div className="fm-rating-line">
                      {selectedEmoji ? `You selected: ${selectedEmoji.label}` : ''}
                    </div>

                    {/* Text area */}
                    <label className="fm-label">
                      Tell us more <span>(optional)</span>
                    </label>
                    <textarea
                      className="fm-textarea"
                      value={feedbackText}
                      onChange={e => setFeedbackText(e.target.value)}
                      placeholder="What did you like or dislike? Any suggestions?"
                      disabled={isSubmitting}
                    />

                    {errorStatus && <p className="fm-error">{errorStatus}</p>}

                    <button
                      className="fm-submit"
                      onClick={handleSubmit}
                      disabled={rating === 0 || isSubmitting}
                    >
                      {isSubmitting
                        ? <><Loader2 size={15} className="fm-spin" /> Submitting…</>
                        : "Submit Feedback"
                      }
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}