import React from 'react';
import { Bot, Sparkles } from 'lucide-react';
import type { ChatMessage } from '../../types/dealRoom';
import { MessageList } from './MessageList';
import { NegotiationLoader } from './NegotiationLoader';
import { ChatInput } from './ChatInput';

interface AiChatDrawerProps {
  messages: ChatMessage[];
  currentUser: string;
  isNegotiating: boolean;
  onSendMessage: (text: string) => void;
}

export const AiChatDrawer: React.FC<AiChatDrawerProps> = ({
  messages,
  currentUser,
  isNegotiating,
  onSendMessage,
}) => {
  return (
    <div className="ai-chat-panel">
      <div className="ai-chat-header">
        <div className="ai-header-info">
          <div className="ai-avatar">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="ai-name">AI Sales Concierge</h3>
            <span className="ai-status-sub">
              <Sparkles size={11} /> Decoupled Background Worker Offloading
            </span>
          </div>
        </div>
      </div>

      <MessageList messages={messages} currentUser={currentUser} />

      <NegotiationLoader isNegotiating={isNegotiating} />

      <ChatInput
        onSendMessage={onSendMessage}
        isNegotiating={isNegotiating}
      />
    </div>
  );
};
