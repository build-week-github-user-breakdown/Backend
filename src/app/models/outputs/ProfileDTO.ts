import { IProfileNode } from 'github/queries';

export interface IProfileDTO extends Omit<IProfileNode, 'repos' | 'commits'> {
  repos: number;
  commits: number;
}
