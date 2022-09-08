import { Handler } from '@netlify/functions';
import {
  fetchTeamworkData,
  pastSevenDays,
  workDays,
  dateConvert,
  arrToString,
} from './helpers';
import { TimeTotals, TeamworkUser } from './types';

// Netlify mandatory handler function, thins function is run when Netlify function is called
const handler: Handler = async (event) => {
  try {
    // Get date for yesterday
    const yesterday: Date = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    // Default from date
    let fromDate: string = '2021-01-01';
    // From date to teamwork format
    let fromDateStr: string = fromDate.replace(/-/g, '');
    // Default to date
    let toDate: string = dateConvert(yesterday);
    // Default to date to teamwork format
    let toDateStr: string = toDate.replace(/-/g, '');
    // Default worktime
    let worktime: number = 7.5;
    // Default balances from before 2021-01-01
    let startingBalance: number = 0;

    // Get Slack payload body
    const eventBodyArr: Array<string> = event.body.split('&');
    // Filter user name from Slcak payload body
    const emailArr: Array<string> = eventBodyArr.filter((item: string) =>
      item.includes('user_name')
    );
    // Convert username to woolman email
    const email: string = `${emailArr[0].replace('user_name=', '')}@woolman.io`;
    // Get custom data from slack payload
    const textArr: Array<string> = eventBodyArr.filter((item: string) =>
      item.includes('text=')
    );
    // Remove text= string from custom data
    const customParameter: string = textArr[0].replace('text=', '');
    // If list is not empty, split it to array from + characters
    if (customParameter) {
      const customParameters: Array<string> = customParameter.split('+');
      // Get custom starting date from Slack parameters
      if (customParameters.some((e: string) => e.includes('from%3D'))) {
        fromDate = arrToString(customParameters, 'from%3D');
        fromDateStr = fromDate.replace(/-/g, '');
      }
      // Get custom end date from Slack parameters
      if (customParameters.some((e: string) => e.includes('to%3D'))) {
        toDate = arrToString(customParameters, 'to%3D');
        toDateStr = toDate.replace(/-/g, '');
      }
      // Get custom worktime from Slack parameters
      if (customParameters.some((e: string) => e.includes('worktime%3D'))) {
        worktime = +arrToString(customParameters, 'worktime%3D');
      }
      // Get custom starting balances from Slack parameters
      if (customParameters.some((e: string) => e.includes('balances%3D'))) {
        startingBalance = +arrToString(customParameters, 'balances%3D');
      }
    }

    // Get user data from teamwork API
    const userData: TeamworkUser = await fetchTeamworkData(
      `${process.env.TEAMWORK_API_URL}/projects/api/v3/people.json?searchTerm=${email}`
    );
    // Assign user ID ased on teamwrok data
    const userId = userData.people[0].id;

    // Fetch user time logs with Teamwork user id
    const hoursData: TimeTotals = await fetchTeamworkData(
      `${process.env.TEAMWORK_API_URL}/time/total.json?userId=${userId}&fromDate=${fromDateStr}&toDate=${toDateStr}&projectType=all`
    );
    // Get main hours from Teamwork API response, this is the only relevant data we need
    const teamworkHours: string = hoursData['time-totals']['total-hours-sum'];

    // Get logged hours from past seven days
    const pastSevenDaysHours: number = await pastSevenDays(
      yesterday,
      userId,
      worktime
    );
    // Set wrokdays for given dates
    const days: number = workDays(new Date(fromDate), new Date(toDate));
    // Calculate time that should be logged between set dates
    const hoursToCompare: number = days * worktime;
    // Calculate hour balances based on time got from teamwork and days set to Slack message
    const hours: number = +teamworkHours - hoursToCompare + startingBalance;
    // Calculate balances in hours
    const hourBalances: number = Math.trunc(hours);
    // Calculate minutes from left over hours
    const minuteBalances: number = Math.ceil((hours % 1) * 60);
    // Calculate balances in hours for past seven days
    const sevenDaysHourBalances: number = Math.trunc(pastSevenDaysHours);
    // Calculate minutes from left over hours for past seven days
    const sevenDaysMinuteBalances: number = Math.ceil(
      ((pastSevenDaysHours - sevenDaysHourBalances) % 1) % 60
    );

    // Texts to be rendered, if we dont have left over minutes just render hours
    const balancesResponse: string =
      minuteBalances !== 0
        ? `${hourBalances}h ${minuteBalances}min`
        : `${hourBalances}h`;
    const pastSevenDaysResponse: string =
      sevenDaysMinuteBalances !== 0
        ? `${sevenDaysHourBalances}h ${sevenDaysMinuteBalances}min`
        : `${sevenDaysHourBalances}h`;

    /**
     * Return needs to be object taht is converted to string.
     * Text: this will be rendered to the customer as response.
     * response_type: this sets the response type, ephemeral means that the response is visible
     * only for the user that typed the slash command in slack
     */
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: `Your balances are ${balancesResponse} from ${fromDate} to ${toDate}. \n\nFrom last seven days your balances are ${pastSevenDaysResponse}`,
        response_type: 'ephemeral',
      }),
    };
  } catch (err) {
    console.log(err);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: `Something went wrong. Make sure you typed extra parameters correctly!`,
        response_type: 'ephemeral',
      }),
    };
  }
};
// Export handler as Netlify has documented it
export { handler };
