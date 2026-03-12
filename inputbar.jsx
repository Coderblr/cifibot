import { useRef, useEffect } from "react";
import styles from "./InputBar.module.css";

const SUGGESTIONS_LOGGED_OUT = [
  "login as admin password secret",
  "help",
];

const SUGGESTIONS_LOGGED_IN = [
  "create a CIF for K region",
  "create 3 CIFs for M region",
  "create NPCIF for B region",
  "create deposit account",
  "help",
];

export default function InputBar({ value, onChange, onSend, loading, loggedIn }) {
  const textareaRef = useRef(null);
  const suggestions = loggedIn ? SUGGESTIONS_LOGGED_IN : SUGGESTIONS_LOGGED_OUT;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + "px";
    }
  }, [value]);

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  function focusInput() {
    textareaRef.current?.focus();
  }

  const canSend = value.trim().length > 0 && !loading;

  return (
    <div className={styles.wrapper}>
      {/* Suggestions */}
      <div className={styles.suggestions}>
        {suggestions.map((s) => (
          <button
            key={s}
            className={styles.chip}
            onClick={() => { onChange(s); focusInput(); }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className={`${styles.inputBox} ${value ? styles.inputBoxActive : ""}`}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder='Try: "create a CIF for K region"'
          rows={1}
          spellCheck={false}
        />
        <button
          className={`${styles.sendBtn} ${canSend ? styles.sendBtnActive : ""}`}
          onClick={onSend}
          disabled={!canSend}
          aria-label="Send"
        >
          {loading ? (
            <span className={styles.spinner} />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          )}
        </button>
      </div>

      <p className={styles.hint}>
        <kbd>Enter</kbd> to send &nbsp;·&nbsp; <kbd>Shift+Enter</kbd> for new line
      </p>
    </div>
  );
}
