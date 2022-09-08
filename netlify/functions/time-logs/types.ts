// Teamwork time API response object
export interface TimeTotals {
  STATUS: string;
  'time-totals': {
    'total-hours-sum': string;
  };
}

// Teamwork user API response object
export interface TeamworkUser {
  people: people[];
}

// People object in Teamwork user API people array
interface people {
  id: number;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
}
