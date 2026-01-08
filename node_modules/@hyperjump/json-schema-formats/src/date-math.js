/** @type (month: string, year: number) => number */
export const daysInMonth = (month, year) => {
  switch (month) {
    case "01":
    case "Jan":
    case "03":
    case "Mar":
    case "05":
    case "May":
    case "07":
    case "Jul":
    case "08":
    case "Aug":
    case "10":
    case "Oct":
    case "12":
    case "Dec":
      return 31;
    case "04":
    case "Apr":
    case "06":
    case "Jun":
    case "09":
    case "Sep":
    case "11":
    case "Nov":
      return 30;
    case "02":
    case "Feb":
      return isLeapYear(year) ? 29 : 28;
    default:
      return 0;
  }
};

/** @type (year: number) => boolean */
export const isLeapYear = (year) => {
  return (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0));
};

/** @type (date: Date) => boolean */
export const hasLeapSecond = (date) => {
  const utcDate = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
  return leapSecondDates.has(utcDate)
    && date.getUTCHours() === 23
    && date.getUTCMinutes() === 59;
};

const leapSecondDates = new Set([
  "1960-12-31",
  "1961-07-31",
  "1961-12-31",
  "1963-10-31",
  "1963-12-31",
  "1964-03-31",
  "1964-08-31",
  "1964-12-31",
  "1965-02-28",
  "1965-06-30",
  "1965-08-31",
  "1965-12-31",
  "1968-01-31",
  "1971-12-31",
  "1972-06-30",
  "1972-12-31",
  "1973-12-31",
  "1974-12-31",
  "1975-12-31",
  "1976-12-31",
  "1977-12-31",
  "1978-12-31",
  "1979-12-31",
  "1981-06-30",
  "1982-06-30",
  "1983-06-30",
  "1985-06-30",
  "1987-12-31",
  "1989-12-31",
  "1990-12-31",
  "1992-06-30",
  "1993-06-30",
  "1994-06-30",
  "1995-12-31",
  "1997-06-30",
  "1998-12-31",
  "2005-12-31",
  "2008-12-31",
  "2012-06-30",
  "2015-06-30",
  "2016-12-31"
]);

/** @type (dayName: string) => number */
export const dayOfWeekId = (dayName) => {
  switch (dayName) {
    case "Sun":
    case "Sunday":
      return 0;
    case "Mon":
    case "Monday":
      return 1;
    case "Tue":
    case "Tuesday":
      return 2;
    case "Wed":
    case "Wednesday":
      return 3;
    case "Thu":
    case "Thursday":
      return 4;
    case "Fri":
    case "Friday":
      return 5;
    case "Sat":
    case "Saturday":
      return 6;
    default:
      return -1;
  }
};
