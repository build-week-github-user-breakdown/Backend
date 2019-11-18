import { ICalendarDTO } from 'models';
import { ICalendarPayload, IDay } from 'github/queries';
import { IRepoCommits, IRepoLang } from 'github/queries';

import { mode } from './arr.util';

export const formatCalendar: (contributionCalendar: ICalendarPayload) => ICalendarDTO = (
  contributionCalendar
) => {
  return {
    colors: contributionCalendar.colors,
    data: contributionCalendar.weeks.reduce(
      (days, week) => days.concat(...week.contributionDays),
      new Array<IDay>()
    ),
  };
};

export const calculateDateTendencies: (
  commits: IRepoCommits[]
) => [number | string, number | string] = (commits) => {
  const dates = commits.reduce((repos, repo) => {
    if (!repo.defaultBranchRef) return repos;

    const { nodes } = repo.defaultBranchRef.target.history;
    const datesOfRepo = nodes.reduce(
      (result, commit) => [...result, commit.committedDate],
      Array<string>()
    );

    return [...repos, ...datesOfRepo];
  }, Array<string>());

  const formatted = dates.map((date) => new Date(date));
  const hours = formatted.map((date) => date.getHours());
  const daysOfWeek = formatted.map((date) => date.getDay());

  return [mode(hours) || 'Undetermined', mode(daysOfWeek) || 'Undetermined'];
};

export const calculateLangTendencies: (langs: IRepoLang[]) => string = (langs) => {
  const result = langs.reduce((all, lang) => {
    if (!lang.primaryLanguage) return all;
    return [...all, lang.primaryLanguage.name];
  }, Array<string>());

  return mode(result) || 'Undetermined';
};
