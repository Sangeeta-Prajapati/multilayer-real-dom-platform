import React from 'react';
import { User, Users } from 'lucide-react';

interface UserSwitcherProps {
  currentUser: string;
  activeUsers: string[];
  onSelectUser: (userId: string) => void;
}

export const UserSwitcher: React.FC<UserSwitcherProps> = ({
  currentUser,
  activeUsers,
  onSelectUser,
}) => {
  return (
    <div className="user-switcher-container">
      <div className="user-switcher-label">
        <Users size={15} />
        <span>Active in Room:</span>
      </div>
      <div className="user-chips">
        {['U-101', 'U-102'].map((userId) => {
          const isActive = currentUser === userId;
          const isUserInRoom = activeUsers.includes(userId);
          const alias = userId === 'U-101' ? 'User A' : 'User B';

          return (
            <button
              key={userId}
              type="button"
              className={`user-chip ${isActive ? 'selected' : ''}`}
              onClick={() => onSelectUser(userId)}
            >
              <User size={13} />
              <span className="user-name">{alias} ({userId})</span>
              {isUserInRoom && <span className="online-indicator" title="Connected in Room" />}
              {isActive && <span className="current-badge">YOU</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};
