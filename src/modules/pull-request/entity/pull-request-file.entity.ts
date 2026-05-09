import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { PullRequest } from "./pull-request.entity";
import { PrFileState } from "../enums/pr-file-state.enum";

@Entity('pull_request_files')
@Unique(['pullRequest', 'fileName'])
export class PullRequestFile {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => PullRequest, pr => pr.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'pull_request_id' })
    pullRequest!: PullRequest;

    @Column({name: 'file_name', type: 'varchar', length: 255, nullable: false })
    fileName!: string;

    @Column({name: 'patch', type: 'text', nullable: false })
    patch!: string;

    @Column({name: 'status', type: 'varchar', enum: PrFileState, nullable: false })
    status!: PrFileState;

    @Column({name: 'additions', type: 'int', nullable: false})
    additions!: number;

    @Column({name: 'deletions', type: 'int', nullable: false })
    deletions!: number;

    @Column({name: 'sha', type: 'varchar', nullable: true })
    sha?: string;
}