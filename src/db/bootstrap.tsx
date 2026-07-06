import { useEffect, useState, type ReactNode } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useDb } from '@/db/provider';
import { getSettings } from '@/db/settings';
import { ensureInstancesForDate } from '@/db/instances';
import { ensureSelfCareSeed } from '@/db/seed';
import { recordAppOpen } from '@/db/streak';
import { todayKey } from '@/lib/day';

type BootState = { status: 'loading' } | { status: 'ready' } | { status: 'error'; message: string };

/**
 * Runs once per app start, BEFORE any screen renders: seeds the self-care library on
 * first launch, marks today as opened (for the streak), and expands today's recurring
 * tasks into instances. Rendering children only after this finishes means no screen
 * can ever query the database mid-seed and show a half-empty page.
 */
export function DbBootstrap({ children }: { children: ReactNode }) {
  const db = useDb();
  const [state, setState] = useState<BootState>({ status: 'loading' });

  useEffect(() => {
    (async () => {
      try {
        await ensureSelfCareSeed(db);
        const { dayStartHour } = await getSettings(db);
        const key = todayKey(dayStartHour);
        await recordAppOpen(db, key);
        await ensureInstancesForDate(db, key);
        setState({ status: 'ready' });
      } catch (e) {
        console.error('[DbBootstrap] initialization error:', e);
        setState({ status: 'error', message: e instanceof Error ? e.message : String(e) });
      }
    })();
  }, [db]);

  if (state.status === 'loading') return null;

  if (state.status === 'error') {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', padding: Spacing.four, gap: Spacing.two }}>
        <ThemedText type="subtitle">Something went wrong starting up</ThemedText>
        <ThemedText themeColor="textSecondary">{state.message}</ThemedText>
      </ThemedView>
    );
  }

  return children;
}
