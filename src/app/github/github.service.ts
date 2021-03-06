import { Injectable } from '@nestjs/common';
import { request } from 'graphql-request';

import { IProfileDTO, IDashboard, ICalendarDTO, ITendenciesDTO, IUserDTO } from 'models';
import { formatUser, formatProfile } from 'utils';
import { formatCalendar } from 'utils';
import { calculateLangTendencies, calculateDateTendencies } from 'utils';
import { NotesService } from 'notes/notes.service';

import { ILogon, logon } from './queries';
import { IProfileShort, IProfileShortNode, profileShort } from './queries';
import { IProfile, profile } from './queries';
import { ICalendar, calendar } from './queries';
import { IFollowing, IUserNode, following } from './queries';
import { ITendencies, tendencies } from './queries';
import { ICommit, ICommits, commits } from './queries';
import { IResult, ISearch, findUser } from './queries';

import { IFollow, follow } from './mutations';
import { IUnfollow, unfollow } from './mutations';
import { IRepos, IRepo, repos } from './queries';

@Injectable()
export class GithubService {
  constructor(private readonly notes: NotesService) {}

  private endpoint = 'https://api.github.com/graphql';

  private async request<T = any>(accessToken: string, query: string, variables?: object) {
    return await request<T>(`${this.endpoint}?access_token=${accessToken}`, query, variables);
  }

  public async login(accessToken: string): Promise<string> {
    const { viewer } = await this.request<ILogon>(accessToken, logon);
    return viewer.id;
  }

  public async profile(accessToken: string, id: string): Promise<IProfileDTO> {
    const { node } = await this.request<IProfile>(accessToken, profile, { id });
    return formatProfile(node);
  }

  public async profileShort(accessToken: string, id: string): Promise<IProfileShortNode> {
    const { node } = await this.request<IProfileShort>(accessToken, profileShort, { id });
    return node;
  }

  public async following(
    accessToken: string,
    id: string,
    isActiveUser: boolean
  ): Promise<IUserDTO[]> {
    let nodes: IUserNode[] = [];
    let response: IFollowing;
    let after: string = null;

    do {
      response = await this.request<IFollowing>(accessToken, following, { id, after });
      nodes = [...nodes, ...response.node.following.nodes];
      after = response.node.following.pageInfo.endCursor;
    } while (response.node.following.pageInfo.hasNextPage);

    if (isActiveUser) this.notes.syncFollows(id, nodes);
    return nodes.map((user) => formatUser(user));
  }

  public async dashboard(
    accessToken: string,
    id: string,
    isActiveUser: boolean
  ): Promise<IDashboard> {
    return {
      user: await this.profileShort(accessToken, id),
      following: await this.following(accessToken, id, isActiveUser),
    };
  }

  public async calendar(accessToken: string, id: string): Promise<ICalendarDTO> {
    const { node } = await this.request<ICalendar>(accessToken, calendar, { id });
    return formatCalendar(node.contributionsCollection.contributionCalendar);
  }

  public async tendencies(accessToken: string, id: string): Promise<ITendenciesDTO> {
    const { node } = await this.request<ITendencies>(accessToken, tendencies, { id });
    const [mostOftenHour, mostOftenDay] = calculateDateTendencies(node.repositories.commits);
    const mostUsedLang = calculateLangTendencies(node.repositories.langs);
    return {
      mostOftenHour,
      mostOftenDay,
      mostUsedLang,
    };
  }

  public async repos(accessToken: string, id: string): Promise<IRepo[]> {
    const { node } = await this.request<IRepos>(accessToken, repos, { id });
    return node.repositories.nodes;
  }

  public async commits(accessToken: string, id: string): Promise<ICommit[]> {
    const { node } = await this.request<ICommits>(accessToken, commits, { id });
    return node.repositories.nodes.reduce(
      (all, repo) => [...all, ...repo.defaultBranchRef.target.history.nodes],
      new Array<ICommit>()
    );
  }

  public async search(accessToken: string, query: string): Promise<IResult[]> {
    const { search } = await this.request<ISearch>(accessToken, findUser, { query });
    return search.nodes;
  }

  public async follow(
    accessToken: string,
    currentUser: string,
    id: string
  ): Promise<IFollow['followUser']['user']> {
    const { followUser } = await this.request<IFollow>(accessToken, follow, { id });
    if (followUser.user.viewerIsFollowing) await this.notes.createFollow(currentUser, id);
    return followUser.user;
  }

  public async unfollow(
    accessToken: string,
    currentUser: string,
    id: string
  ): Promise<IUnfollow['unfollowUser']['user']> {
    const { unfollowUser } = await this.request<IUnfollow>(accessToken, unfollow, { id });
    if (!unfollowUser.user.viewerIsFollowing) await this.notes.removeFollow(currentUser, id);
    return unfollowUser.user;
  }
}
