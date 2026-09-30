import React, { useEffect, useState } from 'react';
import { Bot, Loader2, Sparkles } from 'lucide-react';

interface NegotiationLoaderProps {
  isNegotiating: boolean;
}

const NEGOTIATION_STEPS = [
  'Offloaded to Redis message queue...',
  'Background worker picked up negotiation job...',
  'Evaluating cart bundle margin...',
  'Authorizing custom discount with store manager...',
  'Streaming response back to Deal Room...',
];

export const NegotiationLoader: React.FC<NegotiationLoaderProps> = ({
  isNegotiating,
}) => {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!isNegotiating) {
      setStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % NEGOTIATION_STEPS.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isNegotiating]);

  if (!isNegotiating) return null;

  return (
    <div className="negotiation-loader-card">
      <div className="negotiation-header">
        <div className="bot-pulse">
          <Bot size={18} className="bot-icon animate-pulse" />
          <Loader2 size={16} className="spinner-icon animate-spin" />
        </div>
        <div className="negotiation-text">
          <span className="negotiation-title">10s AI Negotiation in Progress</span>
          <span className="negotiation-subtitle">
            <Sparkles size={12} /> {NEGOTIATION_STEPS[stepIndex]}
          </span>
        </div>
      </div>
      <div className="negotiation-progress-bar">
        <div className="negotiation-fill-animation" />
      </div>
    </div>
  );
};
