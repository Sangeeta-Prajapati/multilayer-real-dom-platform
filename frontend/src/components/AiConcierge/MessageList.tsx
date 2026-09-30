import React, { useEffect, useRef } from 'react';
import { Bot, User, ShieldCheck } from 'lucide-react';
import type { ChatMessage } from '../../types/dealRoom';

interface MessageListProps {
  messages: ChatMessage[];
  currentUser: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUser,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="message-list">
      {messages.map((msg) => {
        if (msg.sender === 'system') {
          return (
            <div key={msg.id} className="system-message">
              <ShieldCheck size={12} />
              <span>{msg.text}</span>
            </div>
          );
        }

        const isMe = msg.userId === currentUser;
        const isAi = msg.sender === 'ai';
        const senderLabel = isAi
          ? 'AI Sales Concierge'
          : isMe
          ? 'You'
          : msg.userId === 'U-101'
          ? 'User A'
          : 'User B';

        return (
          <div
            key={msg.id}
            className={`message-row ${
              isAi ? 'ai-row' : isMe ? 'me-row' : 'peer-row'
            }`}
          >
            <div className="message-bubble">
              <div className="message-meta">
                <span className="sender-icon">
                  {isAi ? <Bot size={13} /> : <User size={13} />}
                </span>
                <span className="sender-name">{senderLabel}</span>
                <span className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="message-body">
                {msg.text}
                {msg.isStreaming && (
                  <span className="streaming-cursor" title="Streaming token from worker">▋</span>
                )}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};
