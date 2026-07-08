import { useCallback, useEffect, useState } from 'react';

import { useDb } from '@/db/provider';
import { Category, listCategories, upsertCategory } from '@/db/categories';

/** The category list (with colors), plus mutations for the CategoryPicker. */
export function useCategories() {
  const db = useDb();
  const [categories, setCategories] = useState<Category[]>([]);

  const refresh = useCallback(async () => {
    setCategories(await listCategories(db));
  }, [db]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional initial data load on mount
    refresh();
  }, [refresh]);

  const saveCategory = useCallback(
    async (name: string, color: string) => {
      await upsertCategory(db, name, color);
      await refresh();
    },
    [db, refresh]
  );

  return { categories, saveCategory };
}
