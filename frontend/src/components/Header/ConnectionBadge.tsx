import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionBadgeProps {
  isConnected: boolean;
  onToggleConnection?: () => void;
}

export const ConnectionBadge: React.FC<ConnectionBadgeProps> = ({
  isConnected,
  onToggleConnection,
}) => {
  return (
    <div className="connection-badge-container">
      <div className={`status-pill ${isConnected ? 'online' : 'reconnecting'}`}>
        {isConnected ? (
          <>
            <span className="pulse-dot"></span>
            <Wifi size={14} />
            <span>Synced (WebSocket)</span>
          </>
        ) : (
          <>
            <WifiOff size={14} />
            <span>Reconnecting...</span>
          </>
        )}
      </div>

      {onToggleConnection && (
        <button
          type="button"
          onClick={onToggleConnection}
          className="test-disconnect-btn"
          title="Simulate dropping WebSocket connection to test durability"
        >
          {isConnected ? 'Simulate Drop' : 'Reconnect'}
        </button>
      )}
    </div>
  );
};
