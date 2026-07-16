function createDateUTC(year, monthIndex, day) {
  return new Date(Date.UTC(year, monthIndex, day));
}

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

/**
 * Ghana public holiday adjustment rule used by the portal:
 * - Tuesday, Wednesday, Thursday => observed on following Friday
 * - Saturday, Sunday => observed on following Monday
 * - Monday and Friday remain unchanged
 *
 * Note:
 * Official declarations may still override this. Eid dates must be entered
 * manually when announced.
 */
function getObservedDate(date) {
  const day = date.getUTCDay();

  // Sunday => Monday
  if (day === 0) {
    return addDays(date, 1);
  }

  // Tuesday => Friday
  if (day === 2) {
    return addDays(date, 3);
  }

  // Wednesday => Friday
  if (day === 3) {
    return addDays(date, 2);
  }

  // Thursday => Friday
  if (day === 4) {
    return addDays(date, 1);
  }

  // Saturday => Monday
  if (day === 6) {
    return addDays(date, 2);
  }

  return date;
}

/**
 * Gregorian Easter Sunday calculation.
 * Returns Easter Sunday as a UTC Date.
 */
function getEasterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return createDateUTC(year, month - 1, day);
}

function getFirstFridayInDecember(year) {
  const date = createDateUTC(year, 11, 1);

  while (date.getUTCDay() !== 5) {
    date.setUTCDate(date.getUTCDate() + 1);
  }

  return date;
}

function makeHoliday({ year, name, baseDate, holidayType }) {
  const observedDate = getObservedDate(baseDate);

  return {
    name,
    year,
    base_date: toISODate(baseDate),
    holiday_date: toISODate(observedDate),
    observed_date: toISODate(observedDate),
    holiday_type: holidayType,
    source: "ghana_holiday_generator",
  };
}

/**
 * Generates Ghana statutory public holidays that can be calculated.
 *
 * Eid-ul-Fitr, Shaqq Day, and Eid-ul-Adha are excluded because the Ministry
 * states they do not have fixed dates and are provided by the Office of the
 * Chief Imam.
 */
export function generateGhanaPublicHolidays(year) {
  const easterSunday = getEasterSunday(year);
  const goodFriday = addDays(easterSunday, -2);
  const easterMonday = addDays(easterSunday, 1);

  const fixedAndCalculatedHolidays = [
    {
      name: "New Year’s Day",
      baseDate: createDateUTC(year, 0, 1),
      holidayType: "fixed",
    },
    {
      name: "Constitution Day",
      baseDate: createDateUTC(year, 0, 7),
      holidayType: "fixed",
    },
    {
      name: "Independence Day",
      baseDate: createDateUTC(year, 2, 6),
      holidayType: "fixed",
    },
    {
      name: "Good Friday",
      baseDate: goodFriday,
      holidayType: "movable_christian",
    },
    {
      name: "Easter Monday",
      baseDate: easterMonday,
      holidayType: "movable_christian",
    },
    {
      name: "Labour Day",
      baseDate: createDateUTC(year, 4, 1),
      holidayType: "fixed",
    },
    {
      name: "Republic Day",
      baseDate: createDateUTC(year, 6, 1),
      holidayType: "fixed",
    },
    {
      name: "Founder’s Day",
      baseDate: createDateUTC(year, 8, 21),
      holidayType: "fixed",
    },
    {
      name: "Farmer’s Day",
      baseDate: getFirstFridayInDecember(year),
      holidayType: "calculated",
    },
    {
      name: "Christmas Day",
      baseDate: createDateUTC(year, 11, 25),
      holidayType: "fixed",
    },
    {
      name: "Boxing Day",
      baseDate: createDateUTC(year, 11, 26),
      holidayType: "fixed",
    },
  ];

  return fixedAndCalculatedHolidays.map((holiday) =>
    makeHoliday({
      year,
      name: holiday.name,
      baseDate: holiday.baseDate,
      holidayType: holiday.holidayType,
    })
  );
}