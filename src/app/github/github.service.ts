import { Injectable } from '@nestjs/common';
import { request } from 'graphql-request';

import { ICalendarDTO } from '../models/CalendarDTO';
import { ILogon, logon } from './queries';
import { IProfile, profile } from './queries';
import { ICalendarVariables, ICalendar, IDay, ICalendarPayload, calendar } from './queries';

@Injectable()
export class GithubService {
  private endpoint = 'https://api.github.com/graphql';

  private async request<T = any>(accessToken: string, query: string, variables?: object) {
    return await request<T>(`${this.endpoint}?access_token=${accessToken}`, query, variables);
  }

  public async login(accessToken: string): Promise<string> {
    const { viewer } = await this.request<ILogon>(accessToken, logon);
    return viewer.id;
  }

  public async profile(accessToken: string): Promise<IProfile['viewer']> {
    const { viewer } = await this.request<IProfile>(accessToken, profile);
    return viewer;
  }

  public async calendar(accessToken: string, id: string): Promise<ICalendarDTO> {
    const { viewer } = await this.request<ICalendar>(accessToken, calendar, {
      id,
    } as ICalendarVariables);
    const payload = this.formatCalendar(viewer.contributionsCollection.contributionCalendar);
    return payload;
  }

  private formatCalendar(contributionCalendar: ICalendarPayload): ICalendarDTO {
    return {
      colors: contributionCalendar.colors,
      data: contributionCalendar.weeks.reduce(
        (days, week) => days.concat(...week.contributionDays),
        new Array<IDay>()
      ),
    };
  }
}
