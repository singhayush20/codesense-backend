export enum PrFileState {
    ADDED = 'added',
    MODIFIED = 'modified',
    REMOVED = 'removed',
    RENAMED = 'renamed',
}

export function getPrFileStateFromString(state: string): PrFileState {
    if (Object.values(PrFileState).includes(state as PrFileState)) {
        return state as PrFileState;
    }
    throw new Error(`Invalid PR file state: ${state}`);
}