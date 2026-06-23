import { SQLiteProvider } from 'expo-sqlite';
import type { ReactNode } from 'react';

import { migrateDbIfNeeded } from '@/db/schema';

export const DATABASE_NAME = 'doing.db';

export function DbProvider({ children }: { children: ReactNode }) {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
      {children}
    </SQLiteProvider>
  );
}

export { useSQLiteContext as useDb } from 'expo-sqlite';
