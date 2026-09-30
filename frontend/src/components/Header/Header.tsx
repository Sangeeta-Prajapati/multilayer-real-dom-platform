import React from 'react';
import { ShoppingBag, ShieldCheck } from 'lucide-react';
import { ConnectionBadge } from './ConnectionBadge';
import { UserSwitcher } from './UserSwitcher';

interface HeaderProps {
  roomId: string;
  currentUser: string;
  activeUsers: string[];
  isConnected: boolean;
  onSelectUser: (userId: string) => void;
  onToggleConnection?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  roomId,
  currentUser,
  activeUsers,
  isConnected,
  onSelectUser,
  onToggleConnection,
}) => {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="logo-box">
          <ShoppingBag className="logo-icon" size={24} />
        </div>
        <div>
          <h1 className="brand-title">Multiplayer Deal Room</h1>
          <div className="room-meta">
            <span className="room-tag">Room ID: <strong>{roomId}</strong></span>
            <span className="security-tag"><ShieldCheck size={12} /> Atomic Distributed Sync</span>
          </div>
        </div>
      </div>

      <div className="header-actions">
        <UserSwitcher
          currentUser={currentUser}
          activeUsers={activeUsers}
          onSelectUser={onSelectUser}
        />
        <ConnectionBadge
          isConnected={isConnected}
          onToggleConnection={onToggleConnection}
        />
      </div>
    </header>
  );
};
