import { useEffect, useState } from 'react';

import { useDb } from '@/db/provider';
import { listCategories } from '@/db/tasks';

/** Seeded + in-use category names, for populating the CategoryPicker dropdown. */
export function useCategories(): string[] {
  const db = useDb();
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    listCategories(db).then(setCategories);
  }, [db]);

  return categories;
}
