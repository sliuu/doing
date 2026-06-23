import type { SQLiteDatabase } from 'expo-sqlite';

import { createTask } from '@/db/tasks';

// 0 = Sunday .. 6 = Saturday, matching RecurrenceRule.weekly.daysOfWeek.
const SEED_EASY_WINS: { title: string; emoji: string; dayOfWeek: number }[] = [
  { title: "Name three things you're grateful for today", emoji: '🙏', dayOfWeek: 0 },
  { title: 'Go on a short walk to get some fresh air', emoji: '🚶', dayOfWeek: 0 },
  { title: 'Light a candle or use a scent you like', emoji: '🕯️', dayOfWeek: 0 },

  { title: 'Name one small win today', emoji: '🏆', dayOfWeek: 1 },
  { title: 'Do 5 squats', emoji: '🏋️', dayOfWeek: 1 },
  { title: 'Tidy your desk or one surface for 5 minutes', emoji: '🧹', dayOfWeek: 1 },

  { title: 'Name one thing you like about yourself', emoji: '💛', dayOfWeek: 2 },
  { title: 'Spend 5 minutes stretching', emoji: '🤸', dayOfWeek: 2 },
  { title: 'Refill your water bottle and drink a glass', emoji: '💧', dayOfWeek: 2 },

  { title: "Write down one thing you're looking forward to", emoji: '✨', dayOfWeek: 3 },
  { title: 'Take one minute to breathe deeply', emoji: '🌬️', dayOfWeek: 3 },
  { title: 'Put on a favorite song and dance for one song', emoji: '💃', dayOfWeek: 3 },

  { title: 'Do a 5 minute grounding meditation', emoji: '🧘', dayOfWeek: 4 },
  { title: 'Send a kind text to a friend', emoji: '💬', dayOfWeek: 4 },
  { title: 'Make a cup of tea', emoji: '🍵', dayOfWeek: 4 },

  { title: 'Write down one worry and one way to let it go', emoji: '📝', dayOfWeek: 5 },
  { title: 'Spend 5 minutes cleaning around the house', emoji: '🧽', dayOfWeek: 5 },
  { title: 'Do a quick body scan and notice how you feel', emoji: '🌀', dayOfWeek: 5 },

  { title: 'Give yourself a compliment out loud', emoji: '😊', dayOfWeek: 6 },
  { title: 'Delete 20 photos from your camera roll', emoji: '📷', dayOfWeek: 6 },
  { title: 'Step outside and look at the sky for a minute', emoji: '🌤️', dayOfWeek: 6 },
];

/** Inserts the 21-item Easy Wins seed library on first run only. */
export async function ensureEasyWinSeed(db: SQLiteDatabase): Promise<void> {
  const existing = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM tasks WHERE is_seed = 1'
  );
  if (existing && existing.count > 0) return;

  for (const item of SEED_EASY_WINS) {
    await createTask(db, {
      title: item.title,
      emoji: item.emoji,
      category: 'self-care',
      isEasyWin: true,
      isSeed: true,
      recurring: true,
      recurrenceRule: { freq: 'weekly', daysOfWeek: [item.dayOfWeek] },
      tracksDuration: false,
    });
  }
}
