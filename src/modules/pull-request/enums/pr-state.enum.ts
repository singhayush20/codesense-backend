export enum PrState {
  OPEN = 'open',
  CLOSED = 'closed',
  MERGED = 'merged',
}

export function getPrStateFromString(state: string): PrState {
  
  if (Object.values(PrState).includes(state as PrState)) {
    return state as PrState;
  }
  throw new Error(`Invalid PR state: ${state}`);
}