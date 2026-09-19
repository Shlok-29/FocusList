import { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash2, Sparkles, CheckCircle2, Info, Trophy, X } from "lucide-react";
import { soundFx } from "../lib/soundEffects";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: "info" | "success" | "achievement";
};

interface NotificationCenterProps {
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onMarkRead: (id: string) => void;
}

export default function NotificationCenter({
  notifications,
  onMarkAllRead,
  onClearAll,
  onMarkRead,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const formatTimeAgo = (ts: number) => {
    const seconds = Math.max(1, Math.floor((Date.now() - ts) / 1000));
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle2 size={16} className="text-emerald-500" />;
      case "achievement":
        return <Trophy size={16} className="text-amber-500" />;
      default:
        return <Info size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="relative inline-block" ref={panelRef}>
      {/* Bell Trigger Button */}
      <button
        className="notification-bell-btn"
        onClick={() => {
          soundFx.playClick();
          setIsOpen(!isOpen);
        }}
        aria-label="Notifications"
        title="Notification Center"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="notification-badge-dot animate-pulse">{unreadCount}</span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="notification-dropdown-panel animate-in fade-in zoom-in-95 duration-150">
          <div className="notif-header">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-coral-accent" />
              <span className="font-bold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="unread-chip">{unreadCount} new</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                className="notif-action-btn"
                onClick={() => {
                  soundFx.playClick();
                  onMarkAllRead();
                }}
              >
                Mark read
              </button>
            )}
          </div>

          <div className="notif-list-body">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.read ? "unread" : ""}`}
                  onClick={() => onMarkRead(n.id)}
                >
                  <div className="notif-icon">{getIcon(n.type)}</div>
                  <div className="notif-content">
                    <div className="notif-title-row">
                      <span className="notif-title">{n.title}</span>
                      <span className="notif-time">{formatTimeAgo(n.timestamp)}</span>
                    </div>
                    <p className="notif-msg">{n.message}</p>
                  </div>
                  {!n.read && <span className="unread-indicator-dot" />}
                </div>
              ))
            ) : (
              <div className="notif-empty-state">
                <Bell size={24} className="opacity-40 mb-2" />
                <p className="text-xs text-muted-ink">No notifications yet</p>
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notif-footer">
              <button
                className="notif-clear-btn"
                onClick={() => {
                  soundFx.playClick();
                  onClearAll();
                }}
              >
                <Trash2 size={13} />
                <span>Clear All Notifications</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
