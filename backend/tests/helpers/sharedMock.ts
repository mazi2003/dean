import { createStatefulMockPrisma } from './mockPrisma';

let cachedState: Awaited<ReturnType<typeof createStatefulMockPrisma>> | null = null;

export async function getSharedMockState() {
  if (!cachedState) {
    cachedState = await createStatefulMockPrisma();
  }
  return cachedState;
}
