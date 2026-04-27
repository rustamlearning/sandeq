// ============================================================
// SANDEQ Gamification Engine
// XP, Levels, Streaks, Badges
// ============================================================

import { supabase } from './supabase';

// ============================================================
// LEVEL SYSTEM
// ============================================================
export interface LevelInfo {
  level: number;
  title: string;
  emoji: string;
  minXp: number;
  maxXp: number;
}

export const LEVELS: LevelInfo[] = [
  { level: 1, title: 'Pelaut Pemula', emoji: '🌊', minXp: 0, maxXp: 99 },
  { level: 2, title: 'Pelaut Junior', emoji: '⚓', minXp: 100, maxXp: 249 },
  { level: 3, title: 'Navigator', emoji: '⛵', minXp: 250, maxXp: 499 },
  { level: 4, title: 'Navigator Senior', emoji: '🧭', minXp: 500, maxXp: 999 },
  { level: 5, title: 'Kapten', emoji: '👨‍✈️', minXp: 1000, maxXp: 1999 },
  { level: 6, title: 'Kapten Senior', emoji: '🚢', minXp: 2000, maxXp: 3499 },
  { level: 7, title: 'Laksamana', emoji: '🎖️', minXp: 3500, maxXp: 5499 },
  { level: 8, title: 'Laksamana Agung', emoji: '👑', minXp: 5500, maxXp: 7999 },
  { level: 9, title: 'Master Sandeq', emoji: '🏆', minXp: 8000, maxXp: 11999 },
  { level: 10, title: 'Legenda Sandeq', emoji: '🌟', minXp: 12000, maxXp: 999999 },
];

export function getLevelInfo(xp: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getNextLevel(xp: number): LevelInfo | null {
  const current = getLevelInfo(xp);
  if (current.level >= 10) return null;
  return LEVELS[current.level];
}

export function getProgressToNextLevel(xp: number): { current: number; needed: number; percent: number } {
  const current = getLevelInfo(xp);
  const next = getNextLevel(xp);
  if (!next) return { current: xp, needed: xp, percent: 100 };
  const inLevel = xp - current.minXp;
  const totalNeeded = next.minXp - current.minXp;
  return {
    current: inLevel,
    needed: totalNeeded,
    percent: Math.min(100, Math.round((inLevel / totalNeeded) * 100)),
  };
}

// ============================================================
// XP REWARDS
// ============================================================
export const XP_REWARDS = {
  READ_MATERIAL: 10,
  COMPLETE_MATERIAL: 25,
  CORRECT_QUIZ: 5,
  WRONG_QUIZ: 1, // Effort still counts!
  MASTERY_FAMILIAR: 30,
  MASTERY_MAHIR: 60,
  MASTERY_DIKUASAI: 100,
  DAILY_STREAK: 20,
  LOGIN_BONUS: 5,
} as const;

export const XP_REASONS = {
  READ: 'Baca materi',
  COMPLETE: 'Selesaikan materi',
  QUIZ_CORRECT: 'Quiz benar',
  QUIZ_TRY: 'Mencoba quiz',
  MASTERY_FAMILIAR: 'Capai familiar',
  MASTERY_MAHIR: 'Capai mahir',
  MASTERY_DIKUASAI: 'Capai dikuasai',
  STREAK: 'Streak harian',
  LOGIN: 'Login harian',
} as const;

// ============================================================
// AWARD XP (panggil function SQL `add_xp`)
// ============================================================
export async function awardXp(
  userId: string,
  amount: number,
  reason: string,
  sourceType?: string,
  sourceId?: string
): Promise<{ success: boolean; newXp?: number; leveledUp?: boolean; newLevel?: LevelInfo }> {
  try {
    // Get current XP
    const { data: userBefore } = await supabase
      .from('users')
      .select('xp, level')
      .eq('id', userId)
      .single();

    const oldXp = userBefore?.xp || 0;
    const oldLevel = getLevelInfo(oldXp);

    // Call SQL function
    const { error } = await supabase.rpc('add_xp', {
      p_user_id: userId,
      p_amount: amount,
      p_reason: reason,
      p_source_type: sourceType || null,
      p_source_id: sourceId || null,
    });

    if (error) throw error;

    const newXp = oldXp + amount;
    const newLevelInfo = getLevelInfo(newXp);
    const leveledUp = newLevelInfo.level > oldLevel.level;

    return {
      success: true,
      newXp,
      leveledUp,
      newLevel: leveledUp ? newLevelInfo : undefined,
    };
  } catch (e: any) {
    console.error('Award XP error:', e);
    return { success: false };
  }
}

// ============================================================
// STREAK MANAGEMENT
// ============================================================
export async function updateStreak(userId: string): Promise<{ streak: number; isNew: boolean }> {
  try {
    const { data: before } = await supabase
      .from('users')
      .select('current_streak, last_activity_date')
      .eq('id', userId)
      .single();

    const today = new Date().toISOString().split('T')[0];
    const alreadyToday = before?.last_activity_date === today;

    if (alreadyToday) {
      return { streak: before?.current_streak || 0, isNew: false };
    }

    await supabase.rpc('update_streak', { p_user_id: userId });

    const { data: after } = await supabase
      .from('users')
      .select('current_streak')
      .eq('id', userId)
      .single();

    return { streak: after?.current_streak || 1, isNew: true };
  } catch (e: any) {
    console.error('Update streak error:', e);
    return { streak: 0, isNew: false };
  }
}

// ============================================================
// AWARD BADGE
// ============================================================
export async function awardBadge(
  userId: string,
  badgeId: string
): Promise<{ awarded: boolean; badge?: any }> {
  try {
    const { data: awarded } = await supabase.rpc('award_badge', {
      p_user_id: userId,
      p_badge_id: badgeId,
    });

    if (!awarded) return { awarded: false };

    const { data: badge } = await supabase
      .from('badges')
      .select('*')
      .eq('id', badgeId)
      .single();

    return { awarded: true, badge };
  } catch (e: any) {
    console.error('Award badge error:', e);
    return { awarded: false };
  }
}

// ============================================================
// BADGE CHECKERS - Check & award based on stats
// ============================================================

export async function checkBadgesAfterActivity(userId: string): Promise<any[]> {
  const newlyAwarded: any[] = [];

  try {
    // Fetch all stats needed
    const [userResult, progressResult, masteryResult, embedQuizResult, tutorResult] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('progress_materi').select('*').eq('user_id', userId),
      supabase.from('mastery_progress').select('*').eq('user_id', userId),
      supabase.from('embedded_quiz_attempts').select('*').eq('user_id', userId),
      supabase.from('tutor_messages').select('id').eq('user_id', userId).eq('role', 'user'),
    ]);

    const user = userResult.data;
    const progress = progressResult.data || [];
    const mastery = masteryResult.data || [];
    const quizzes = embedQuizResult.data || [];
    const tutorMsgs = tutorResult.data || [];

    if (!user) return [];

    const correctQuizzes = quizzes.filter((q) => q.benar);
    const completedMateri = progress.filter((p) => p.selesai);
    const masteredCount = mastery.filter((m) => m.level === 'dikuasai').length;
    const familiarPlus = mastery.filter((m) => ['familiar', 'mahir', 'dikuasai'].includes(m.level)).length;

    // Helper to check & award
    const tryAward = async (badgeId: string) => {
      const result = await awardBadge(userId, badgeId);
      if (result.awarded && result.badge) newlyAwarded.push(result.badge);
    };

    // ===== MILESTONE BADGES =====
    if (progress.length > 0) await tryAward('first_material');
    if (correctQuizzes.length > 0) await tryAward('first_quiz');
    if (completedMateri.length > 0) await tryAward('first_complete');
    if (masteredCount > 0) await tryAward('mastery_first');

    // ===== STREAK BADGES =====
    if (user.current_streak >= 3) await tryAward('streak_3');
    if (user.current_streak >= 7) await tryAward('streak_7');
    if (user.current_streak >= 14) await tryAward('streak_14');
    if (user.current_streak >= 30) await tryAward('streak_30');
    if (user.current_streak >= 100) await tryAward('streak_100');

    // ===== QUIZ BADGES =====
    if (correctQuizzes.length >= 10) await tryAward('quiz_10');
    if (correctQuizzes.length >= 50) await tryAward('quiz_50');

    // ===== MATERIAL BADGES =====
    if (progress.length >= 10) await tryAward('material_10');
    if (progress.length >= 50) await tryAward('material_50');
    if (completedMateri.length >= 5) await tryAward('material_complete_5');
    if (completedMateri.length >= 25) await tryAward('material_complete_25');

    // ===== MASTERY BADGES =====
    if (masteredCount >= 5) await tryAward('mastery_5');
    if (masteredCount >= 25) await tryAward('mastery_25');

    // ===== LEVEL BADGES =====
    if ((user.level || 1) >= 5) await tryAward('level_5');
    if ((user.level || 1) >= 10) await tryAward('level_10');

    // ===== SOCIAL BADGES =====
    if (tutorMsgs.length >= 50) await tryAward('tutor_friend');

    // ===== TIME-BASED BADGES =====
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 4) await tryAward('night_owl');
    if (hour >= 4 && hour < 7) await tryAward('early_bird');

    const day = new Date().getDay();
    if (day === 0 || day === 6) await tryAward('weekend_warrior');

    // ===== MAPEL MASTER (any mapel completed fully) =====
    if (masteredCount >= 1) {
      // Check if any mapel is fully mastered
      const { data: masteredMateri } = await supabase
        .from('materi')
        .select('id, mapel')
        .in(
          'id',
          mastery.filter((m) => m.level === 'dikuasai').map((m) => m.materi_id)
        );

      if (masteredMateri && masteredMateri.length > 0) {
        const mapelMastered: Record<string, number> = {};
        masteredMateri.forEach((m: any) => {
          mapelMastered[m.mapel] = (mapelMastered[m.mapel] || 0) + 1;
        });

        for (const mapel of Object.keys(mapelMastered)) {
          const { data: totalInMapel } = await supabase
            .from('materi')
            .select('id', { count: 'exact', head: true })
            .eq('mapel', mapel);
          const total = (totalInMapel as any)?.count || 0;
          if (total > 0 && mapelMastered[mapel] >= total) {
            await tryAward('mapel_master');
            break;
          }
        }

        // 10 different mapel mastered
        if (Object.keys(mapelMastered).length >= 10) {
          await tryAward('all_mapel_master');
        }
      }
    }

    return newlyAwarded;
  } catch (e: any) {
    console.error('Check badges error:', e);
    return newlyAwarded;
  }
}

// ============================================================
// LEADERBOARD
// ============================================================
export interface LeaderboardEntry {
  user_id: string;
  nama: string;
  xp: number;
  level: number;
  current_streak: number;
  rank: number;
}

export async function getKelasLeaderboard(kelasId: string, limit: number = 50): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, nama, xp, level, current_streak, hide_from_leaderboard')
    .eq('kelas_id', kelasId)
    .eq('role', 'siswa')
    .eq('hide_from_leaderboard', false)
    .order('xp', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((u: any, i: number) => ({
    user_id: u.id,
    nama: u.nama,
    xp: u.xp || 0,
    level: u.level || 1,
    current_streak: u.current_streak || 0,
    rank: i + 1,
  }));
}

// ============================================================
// USER STATS (untuk profile page)
// ============================================================
export interface UserStats {
  xp: number;
  level: number;
  levelInfo: LevelInfo;
  nextLevel: LevelInfo | null;
  progressPercent: number;
  currentStreak: number;
  longestStreak: number;
  totalMateriRead: number;
  totalMateriCompleted: number;
  totalQuizCorrect: number;
  totalQuizAttempted: number;
  totalMastered: number;
  totalBadges: number;
  badges: any[];
}

export async function getUserStats(userId: string): Promise<UserStats | null> {
  try {
    const [userResult, progressResult, masteryResult, quizResult, badgesResult] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('progress_materi').select('*').eq('user_id', userId),
      supabase.from('mastery_progress').select('*').eq('user_id', userId),
      supabase.from('embedded_quiz_attempts').select('*').eq('user_id', userId),
      supabase
        .from('user_badges')
        .select('*, badges(*)')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false }),
    ]);

    const user = userResult.data;
    if (!user) return null;

    const progress = progressResult.data || [];
    const mastery = masteryResult.data || [];
    const quizzes = quizResult.data || [];
    const badges = badgesResult.data || [];

    const xp = user.xp || 0;
    const levelInfo = getLevelInfo(xp);
    const nextLevel = getNextLevel(xp);
    const progress_ = getProgressToNextLevel(xp);

    return {
      xp,
      level: user.level || 1,
      levelInfo,
      nextLevel,
      progressPercent: progress_.percent,
      currentStreak: user.current_streak || 0,
      longestStreak: user.longest_streak || 0,
      totalMateriRead: progress.length,
      totalMateriCompleted: progress.filter((p: any) => p.selesai).length,
      totalQuizCorrect: quizzes.filter((q: any) => q.benar).length,
      totalQuizAttempted: quizzes.length,
      totalMastered: mastery.filter((m: any) => m.level === 'dikuasai').length,
      totalBadges: badges.length,
      badges,
    };
  } catch (e: any) {
    console.error('Get user stats error:', e);
    return null;
  }
}

// ============================================================
// HELPER: Activity recording (call this on important events)
// ============================================================
export async function recordActivity(
  userId: string,
  activityType: 'read_material' | 'complete_material' | 'quiz_correct' | 'quiz_wrong' | 'mastery_achieved',
  options?: { materiId?: string; masteryLevel?: string }
): Promise<{
  xpGained: number;
  leveledUp: boolean;
  newLevel?: LevelInfo;
  newBadges: any[];
  streak: number;
}> {
  let xpAmount = 0;
  let xpReason = '';

  switch (activityType) {
    case 'read_material':
      xpAmount = XP_REWARDS.READ_MATERIAL;
      xpReason = XP_REASONS.READ;
      break;
    case 'complete_material':
      xpAmount = XP_REWARDS.COMPLETE_MATERIAL;
      xpReason = XP_REASONS.COMPLETE;
      break;
    case 'quiz_correct':
      xpAmount = XP_REWARDS.CORRECT_QUIZ;
      xpReason = XP_REASONS.QUIZ_CORRECT;
      break;
    case 'quiz_wrong':
      xpAmount = XP_REWARDS.WRONG_QUIZ;
      xpReason = XP_REASONS.QUIZ_TRY;
      break;
    case 'mastery_achieved':
      if (options?.masteryLevel === 'dikuasai') {
        xpAmount = XP_REWARDS.MASTERY_DIKUASAI;
        xpReason = XP_REASONS.MASTERY_DIKUASAI;
      } else if (options?.masteryLevel === 'mahir') {
        xpAmount = XP_REWARDS.MASTERY_MAHIR;
        xpReason = XP_REASONS.MASTERY_MAHIR;
      } else if (options?.masteryLevel === 'familiar') {
        xpAmount = XP_REWARDS.MASTERY_FAMILIAR;
        xpReason = XP_REASONS.MASTERY_FAMILIAR;
      }
      break;
  }

  // Award XP
  const xpResult = xpAmount > 0
    ? await awardXp(userId, xpAmount, xpReason, activityType, options?.materiId)
    : { success: false, leveledUp: false };

  // Update streak
  const streakResult = await updateStreak(userId);

  // Check & award badges
  const newBadges = await checkBadgesAfterActivity(userId);

  return {
    xpGained: xpAmount,
    leveledUp: xpResult.leveledUp || false,
    newLevel: xpResult.newLevel,
    newBadges,
    streak: streakResult.streak,
  };
}
