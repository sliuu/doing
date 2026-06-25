import type { SQLiteDatabase } from 'expo-sqlite';

import { createTask } from '@/db/tasks';

const SEED_SELF_CARE: { title: string; section: string }[] = [
  { title: "Name three things you're grateful for today", section: 'gratitude' },
  { title: 'Go on a short walk to get some fresh air', section: 'energizing' },
  { title: 'Light a candle or use a scent you like', section: 'energizing' },
  { title: 'Name one small win today', section: 'gratitude' },
  { title: 'Do 5 squats', section: 'energizing' },
  { title: 'Tidy your desk or one surface for 5 minutes', section: 'cleaning' },
  { title: 'Name one thing you like about yourself', section: 'gratitude' },
  { title: 'Spend 5 minutes stretching', section: 'energizing' },
  { title: 'Refill your water bottle and drink a glass', section: 'energizing' },
  { title: "Write down one thing you're looking forward to", section: 'gratitude' },
  { title: 'Take one minute to breathe deeply', section: 'calming' },
  { title: 'Put on a favorite song and dance for one song', section: 'fun' },
  { title: 'Do a 5 minute grounding meditation', section: 'calming' },
  { title: 'Send a kind text to a friend', section: 'gratitude' },
  { title: 'Make a cup of tea', section: 'calming' },
  { title: 'Write down one worry and one way to let it go', section: 'calming' },
  { title: 'Spend 5 minutes cleaning around the house', section: 'cleaning' },
  { title: 'Do a quick body scan and notice how you feel', section: 'calming' },
  { title: 'Give yourself a compliment out loud', section: 'gratitude' },
  { title: 'Delete 20 photos from your camera roll', section: 'cleaning' },
  { title: 'Step outside and look at the sky for a minute', section: 'gratitude' },
];

/** Inserts the 21-item Self-Care seed library on first run only. */
export async function ensureSelfCareSeed(db: SQLiteDatabase): Promise<void> {
  const existing = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM tasks WHERE is_seed = 1'
  );
  if (existing && existing.count > 0) return;

  for (const { title, section } of SEED_SELF_CARE) {
    await createTask(db, {
      title,
      category: 'self-care',
      selfCareSection: section,
      isSelfCare: true,
      isSeed: true,
      recurring: true,
      recurrenceRule: { freq: 'daily' },
      tracksDuration: false,
    });
  }
}
