import { useState, useEffect } from 'react';
import { Query, onSnapshot } from 'firebase/firestore';

export function useCollection<T>(query: Query) {
  const [data, setData] = useState<(T & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query,
      (snapshot) => {
        const documents = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as (T & { id: string })[];
        setData(documents);
        setLoading(false);
      },
      (err) => {
        console.error('Firebase collection error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, loading, error };
}