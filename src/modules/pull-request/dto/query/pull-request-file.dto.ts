import { PrFileState } from "../../enums/pr-file-state.enum";

export interface PullRequestFileDto {
    id: string;

    fileName: string;

    status: PrFileState;

    additions: number;

    deletions: number;

    patch?: string;
}