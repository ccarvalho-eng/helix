import React from 'react';
import { Users, X } from 'lucide-react';
import { useThemeContext } from '../contexts/ThemeContext';

interface UserListPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  users: string[];
  currentUser: string;
  anchorElement?: HTMLElement | null;
}

// Generate consistent colors for users based on their username
function getUserColor(username: string): string {
  const colors = [
    '#ef4444', // red
    '#f97316', // orange
    '#f59e0b', // amber
    '#84cc16', // lime
    '#22c55e', // green
    '#10b981', // emerald
    '#06b6d4', // cyan
    '#0ea5e9', // sky
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#a855f7', // purple
    '#d946ef', // fuchsia
    '#ec4899', // pink
  ];

  // Simple hash function to get consistent color for username
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = ((hash << 5) - hash + username.charCodeAt(i)) & 0xffffffff;
  }
  return colors[Math.abs(hash) % colors.length];
}

// Generate avatar initials from username
function getInitials(username: string): string {
  if (!username) return '?';

  const words = username.split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return username.slice(0, 2).toUpperCase();
}

export function UserListPopover({
  isOpen,
  onClose,
  users,
  currentUser,
  anchorElement,
}: UserListPopoverProps) {
  const { theme } = useThemeContext();

  if (!isOpen) return null;

  // Calculate position relative to anchor element
  const getPopoverStyle = () => {
    if (!anchorElement) {
      return {
        position: 'fixed' as const,
        top: '60px',
        right: '20px',
      };
    }

    const rect = anchorElement.getBoundingClientRect();
    return {
      position: 'fixed' as const,
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
      minWidth: rect.width,
    };
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className='user-list-backdrop'
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9998,
          background: 'transparent',
        }}
      />

      {/* Popover */}
      <div
        className='user-list-popover'
        style={{
          ...getPopoverStyle(),
          zIndex: 9999,
          backgroundColor: theme === 'dark' ? '#21252b' : '#ffffff',
          border: `1px solid ${theme === 'dark' ? '#3e4451' : '#e5e7eb'}`,
          borderRadius: '8px',
          boxShadow:
            theme === 'dark' ? '0 10px 40px rgba(0, 0, 0, 0.4)' : '0 10px 40px rgba(0, 0, 0, 0.1)',
          minWidth: '200px',
          maxWidth: '300px',
          animation: 'slideIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${theme === 'dark' ? '#3e4451' : '#e5e7eb'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} color={theme === 'dark' ? '#abb2bf' : '#374151'} />
            <h3
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: '600',
                color: theme === 'dark' ? '#abb2bf' : '#374151',
              }}
            >
              Connected Users ({users.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              color: theme === 'dark' ? '#5c6370' : '#6b7280',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = theme === 'dark' ? '#3e4451' : '#f3f4f6';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* User List */}
        <div style={{ padding: '8px' }}>
          {users.map((user, index) => {
            const isCurrentUser = user === currentUser;
            const color = getUserColor(user);
            const initials = getInitials(user);

            // Extract username from the combined userId (remove the _user_xxxxx part)
            const displayName = user.split('_user_')[0].replace(/_/g, ' ');

            return (
              <div
                key={`${user}-${index}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: isCurrentUser
                    ? theme === 'dark'
                      ? 'rgba(152, 195, 121, 0.1)'
                      : 'rgba(59, 130, 246, 0.1)'
                    : 'transparent',
                  border: isCurrentUser
                    ? `1px solid ${theme === 'dark' ? 'rgba(152, 195, 121, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
                    : '1px solid transparent',
                  marginBottom: index === users.length - 1 ? 0 : '4px',
                }}
              >
                {/* Username */}
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: isCurrentUser ? '600' : '500',
                    color: theme === 'dark' ? '#abb2bf' : '#374151',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {displayName}
                  {isCurrentUser && (
                    <span
                      style={{
                        marginLeft: '8px',
                        fontSize: '12px',
                        fontWeight: '400',
                        color: theme === 'dark' ? '#5c6370' : '#6b7280',
                      }}
                    >
                      (you)
                    </span>
                  )}
                </div>

                {/* Online indicator */}
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#22c55e',
                    flexShrink: 0,
                  }}
                  title='Online'
                />
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '8px 16px 12px',
            borderTop: `1px solid ${theme === 'dark' ? '#3e4451' : '#e5e7eb'}`,
            fontSize: '12px',
            color: theme === 'dark' ? '#5c6370' : '#6b7280',
            textAlign: 'center',
          }}
        >
          Real-time collaboration active
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
