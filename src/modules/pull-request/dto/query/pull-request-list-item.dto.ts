import { PrState } from "../../enums/pr-state.enum";

export interface PullRequestListItemDto {
    id: string;
    prNumber: number;
    title: string;
    author: string;
    state: PrState;
    changedFiles: number;
    additions: number;
    deletions: number;
    createdAt: Date;
    updatedAt: Date;
}