import * as moment from 'moment';

export class DateTimeHelper {
  public static getWeeklyDay(day: number, date = null) {
    let d = date || new Date();

    while (d.getDay() != day) {
      d.setDate(d.getDate() + 1);
    }

    d.setHours(0, 0, 0);
    return d;
  }

  public static getMonthlyDay(dayIndex: number, selectedDay, date = null) {
    let days = [];

    let day = moment().startOf('month').day(selectedDay);
    if (date) {
      day = moment(date).startOf('month').day(selectedDay)
    }

    if (day.date() > 7) {
      day.add(7, 'd');
    }

    days.push(day.clone());

    const month = day.month();

    while (month === day.month()) {
      day.add(7, 'd');
      if (month == day.month()) {
        days.push(day.clone());
      }
    }

    let requiredDay =
      dayIndex < days.length - 1 ? days[dayIndex] : days[days.length - 1];
    if (!requiredDay || (requiredDay && requiredDay.isBefore(moment(), 'd'))) {
      days = [];

      const day = moment()
        .add(1, 'month')
        .startOf('month')
        .day(selectedDay);

      if (day.date() > 7) {
        day.add(7, 'd');
      }

      days.push(day.clone());

      const month = day.month();

      while (month === day.month()) {
        day.add(7, 'd');

        if (month == day.month()) {
          days.push(day.clone());
        }
      }
    }

    requiredDay =
      dayIndex < days.length - 1 ? days[dayIndex] : days[days.length - 1];
    return requiredDay.toDate();
  }
}
