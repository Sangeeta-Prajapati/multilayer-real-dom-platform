import React, { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isNegotiating: boolean;
}

const QUICK_PROMPTS = [
  'If we buy two laptops, can we get a discount?',
  'Can we get a deal on the laptop and mouse bundle?',
  'What is the best offer if we checkout right now?',
];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isNegotiating,
}) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isNegotiating) return;
    onSendMessage(text.trim());
    setText('');
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isNegotiating) return;
    onSendMessage(prompt);
  };

  return (
    <div className="chat-input-wrapper">
      <div className="quick-prompts">
        <span className="prompts-label">
          <Sparkles size={11} /> Quick Haggle:
        </span>
        <div className="prompts-scroll">
          {QUICK_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              className="prompt-chip"
              disabled={isNegotiating}
              onClick={() => handleQuickPrompt(prompt)}
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-text-input"
          placeholder={
            isNegotiating
              ? 'Negotiation in progress...'
              : 'Ask the AI Concierge for a discount...'
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isNegotiating}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={!text.trim() || isNegotiating}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
