'use client';

import { useEffect, useState } from 'react';
import { Award, Flame, Sparkles, Star } from 'lucide-react';
import { LevelInfo } from '@/lib/gamification';

export interface NotificationData {
  id: string;
  type: 'xp' | 'level_up' | 'badge' | 'streak';
  xp?: number;
  reason?: string;
  level?: LevelInfo;
  badge?: any;
  streak?: number;
}

interface XPNotificationProps {
  notifications: NotificationData[];
  onDismiss: (id: string) => void;
}

export default function XPNotification({ notifications, onDismiss }: XPNotificationProps) {
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
      {notifications.map((notif) => (
        <NotificationCard key={notif.id} notif={notif} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function NotificationCard({
  notif,
  onDismiss,
}: {
  notif: NotificationData;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
    const timeout = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(notif.id), 400);
    }, notif.type === 'level_up' || notif.type === 'badge' ? 5000 : 3000);
    return () => clearTimeout(timeout);
  }, [notif.id, notif.type, onDismiss]);

  const transitionClass = visible
    ? 'translate-x-0 opacity-100'
    : 'translate-x-12 opacity-0';

  if (notif.type === 'xp') {
    return (
      <div
        className={`pointer-events-auto bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-xl px-4 py-3 transition-all duration-400 ${transitionClass}`}
      >
        <div className="flex items-center gap-3">
          <Star size={24} />
          <div>
            <div className="font-bold text-lg">+{notif.xp} XP</div>
            <div className="text-xs text-white/80">{notif.reason}</div>
          </div>
        </div>
      </div>
    );
  }

  if (notif.type === 'level_up' && notif.level) {
    return (
      <div
        className={`pointer-events-auto bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-white rounded-lg shadow-2xl px-5 py-4 transition-all duration-400 ${transitionClass} animate-pulse-slow min-w-[300px]`}
      >
        <div className="flex items-center gap-3">
          <Sparkles size={34} />
          <div>
            <div className="text-xs uppercase tracking-wider text-white/80">
              Level Up
            </div>
            <div className="font-bold text-xl">Level {notif.level.level}</div>
            <div className="text-sm font-medium">{notif.level.title}</div>
          </div>
        </div>
      </div>
    );
  }

  if (notif.type === 'badge' && notif.badge) {
    const rarityStyles: Record<string, string> = {
      common: 'from-gray-400 to-gray-600',
      rare: 'from-blue-400 to-blue-600',
      epic: 'from-purple-500 to-pink-600',
      legendary: 'from-yellow-400 via-orange-500 to-red-500',
    };
    const style = rarityStyles[notif.badge.rarity] || rarityStyles.common;

    return (
      <div
        className={`pointer-events-auto bg-gradient-to-r ${style} text-white rounded-lg shadow-2xl px-5 py-4 transition-all duration-400 ${transitionClass} min-w-[300px]`}
      >
        <div className="flex items-center gap-3">
          <Award size={34} />
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider text-white/90 font-semibold">
              Badge Unlocked
            </div>
            <div className="font-bold text-lg">{notif.badge.name}</div>
            <div className="text-xs text-white/90">{notif.badge.description}</div>
            <div className="text-xs mt-1 capitalize bg-white/20 inline-block px-2 py-0.5 rounded-full">
              {notif.badge.rarity}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notif.type === 'streak' && notif.streak) {
    return (
      <div
        className={`pointer-events-auto bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg shadow-xl px-4 py-3 transition-all duration-400 ${transitionClass}`}
      >
        <div className="flex items-center gap-3">
          <Flame size={30} />
          <div>
            <div className="font-bold text-lg">{notif.streak} Hari Streak</div>
            <div className="text-xs text-white/90">Konsisten banget</div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ============================================================
// HELPER HOOK untuk pakai di pages
// ============================================================
export function useXPNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const notify = (notif: Omit<NotificationData, 'id'>) => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    setNotifications((prev) => [...prev, { ...notif, id }]);
  };

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Helper: process activity result and show all notifications
  const showActivityResult = (result: {
    xpGained: number;
    leveledUp: boolean;
    newLevel?: LevelInfo;
    newBadges: any[];
    streak?: number;
  }) => {
    // Show XP gained
    if (result.xpGained > 0) {
      notify({
        type: 'xp',
        xp: result.xpGained,
        reason: 'Aktivitas belajar',
      });
    }

    // Show level up (delayed to stack nicely)
    if (result.leveledUp && result.newLevel) {
      setTimeout(() => {
        notify({
          type: 'level_up',
          level: result.newLevel,
        });
      }, 600);
    }

    // Show badges (one by one, delayed)
    result.newBadges.forEach((badge, i) => {
      setTimeout(() => {
        notify({
          type: 'badge',
          badge,
        });
      }, 1200 + i * 600);
    });
  };

  return { notifications, notify, dismiss, showActivityResult };
}
