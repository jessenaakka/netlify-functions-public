import fetch from 'node-fetch';
import { TimeTotals } from './types';

/**
 * This function is used to fetch teamwork data from differnet teamwork APIs.
 * For authnetication we are using basic auth and we get user credentials from NEtlify env variables.
 * @param url Teamwork API url where to fetch data
 * @returns response object
 */
export const fetchTeamworkData = async function (url: string) {
  const credentials: string = `${process.env.TEAMWORK_USER}:${process.env.TEAMWORK_PASS}`;
  const fetchData = await fetch(url, {
    headers: {
      Authorization: 'Basic '.concat(
        Buffer.from(credentials, 'utf8').toString('base64')
      ),
    },
  });
  const data = await fetchData.json();
  return data;
};

/**
 * This function returns users logged time from past seven days.
 * @param yesterday yesterdays date object
 * @param userId Teamwork user id
 * @param worktime Users working time (default is always 7.7)
 * @returns logged hours
 */
export const pastSevenDays = async function (
  yesterday: Date,
  userId: number,
  worktime: number
) {
  try {
    const from: Date = new Date();
    from.setDate(from.getDate() - 7);
    const fromDate: string = dateConvert(from);
    const fromDateStr: string = fromDate.replace(/-/g, '');
    const toDate: string = dateConvert(yesterday);
    const toDateStr: string = toDate.replace(/-/g, '');

    const timeJSON: TimeTotals = await fetchTeamworkData(
      `${process.env.TEAMWORK_API_URL}/time/total.json?userId=${userId}&fromDate=${fromDateStr}&toDate=${toDateStr}&projectType=all`
    );
    const totalHours: string = timeJSON['time-totals']['total-hours-sum'];

    const days: number = workDays(new Date(fromDate), new Date(toDate));
    const hoursToCompare: number = days * worktime;

    return +totalHours - hoursToCompare;
  } catch (e) {
    console.error(e);
    return;
  }
};

/**
 * Function that calculates work days for passed time
 * @param start Startig date for calculation
 * @param end End date for calculation
 * @returns number of days
 */
export const workDays = (start: Date, end: Date) => {
  let count: number = 0;
  let cur: Date = start;
  while (cur <= end) {
    const dayOfWeek = cur.getDay();
    const isWeekend = dayOfWeek == 6 || dayOfWeek == 0;
    if (!isWeekend) count++;
    const nextDay = new Date(cur);
    nextDay.setDate(nextDay.getDate() + 1);
    cur = nextDay;
  }
  return count;
};

/**
 * Converst date object to a string with formating
 * @param date Date object to be converted
 * @returns Date as a string YYYY-MM--DD
 */
export const dateConvert = (date: Date) =>
  date.toISOString().split('T')[0].toString();

/**
 * Function that return a tring from an array with strings we are looking for
 * @param arr array to be converted
 * @param string string to filter
 * @returns filtered string of values
 */
export const arrToString = (arr: Array<string>, string: string) => {
  const filteredArr = arr.filter((item) => item.includes(string));
  const newString = filteredArr[0].replace(string, '');
  return newString;
};
