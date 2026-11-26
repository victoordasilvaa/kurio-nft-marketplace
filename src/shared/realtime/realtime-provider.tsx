import type { ReactNode } from 'react';

import { RealtimeClientContext } from './realtime-context';
import type { RealtimeClient } from './socket';

export function RealtimeProvider({
  client,
  children,
}: {
  client: RealtimeClient;
  children: ReactNode;
}) {
  return <RealtimeClientContext value={client}>{children}</RealtimeClientContext>;
}
