import { useEffect, useState } from 'react';

import { readServerNow } from './clock';

/** Refreshes from the server Date header about once a minute. */
export function useServerNow(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let alive = true;
    const pull = () => {
      void readServerNow().then((value) => {
        if (alive) setNow(value);
      });
    };
    pull();
    const timer = setInterval(pull, 60_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  return now;
}
