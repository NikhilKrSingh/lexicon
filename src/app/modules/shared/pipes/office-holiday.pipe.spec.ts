import { OfficeHolidayPipe } from './office-holiday.pipe';

describe('OfficeHolidayPipe', () => {
  const pipe = new OfficeHolidayPipe();

  it('Office holiday', () => {
    let item: Array<any> = [{id: 1, date: "2020-04-01T00:00:00"}, {id: 2, date: "2020-05-01T00:00:00"}, {id: 3, date: "2021-04-01T00:00:00"}];
    let year = 2020;
    expect(pipe.transform(item, year)).length == 2;
  });
});
