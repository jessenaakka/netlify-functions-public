# netlify-functions-public
This is the public version for Netlify time-logs function. 

This function is developed to help people working in Woolman to check their hour balances.

Function is invoked using Slack slash command "/hours". Functions gets payload from Slack, where we get Slack user name.
With user name we can create Woolman email, with this email we can get users Teamwork ID from Teamwork users API.
When we know users Teamwork ID we can get users time logs from Teamworks time logs API. 
By default we are calculating hours from 2021-01-01 to yesterday with 7.5 hours as daily working time.

You can add these extra parameters to "/hours" slash command:
1. balances=int (This is intended for people who started working before 2021-01-01, for some they have negative or positive balances so this parameter affects balances with the given integer)
2. from=yyyy-mm-dd (If you want to check balances from certain date to yesterday, you can use this parameter)
3. to=yyyy-mm-dd (If you want to check balances to certain date, you can use this parameter)
4. worktime=int (This was added for people working by hours or having shorter working day than 7.5h, this parameter changes calculation formula to check the default hours you should have in one day)

Function uses basic auth for authentication and critical urls and credentials are set in Netlify environment variables.

Example response from "/hours" slash command
"Your balances are -4h -9min from 2021-01-01 to 2022-11-10.
From last seven days your balances are 4h 1min"
