export interface GithubFileContentResponse {
    name: string;

    path: string;

    sha: string;

    size: number;

    content?: string;

    encoding?: string;
}