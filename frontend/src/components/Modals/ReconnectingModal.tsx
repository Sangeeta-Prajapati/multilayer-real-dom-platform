import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

interface ReconnectingModalProps {
  isOpen: boolean;
  onManualReconnect: () => void;
}

export const ReconnectingModal: React.FC<ReconnectingModalProps> = ({
  isOpen,
  onManualReconnect,
}) => {
  if (!isOpen) return null;

  return (
    <div className="reconnecting-toast">
      <div className="toast-icon">
        <WifiOff size={18} />
      </div>
      <div className="toast-content">
        <strong>WebSocket Disconnected (Testing Durability)</strong>
        <p>
          Attempting automatic reconnection & state hydration from backend...
        </p>
      </div>
      <button
        type="button"
        className="toast-reconnect-btn"
        onClick={onManualReconnect}
      >
        <RefreshCw size={13} className="spin-icon" />
        <span>Reconnect Now</span>
      </button>
    </div>
  );
};
