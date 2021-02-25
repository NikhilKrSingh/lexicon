import { ExpiredMonthYearPipe } from './expired-month-year.pipe';

describe('ExpiredMonthYearPipe', () => {
  it('create an instance', () => {
    const pipe = new ExpiredMonthYearPipe();
    expect(pipe).toBeTruthy();
  });

  it('return month year', () => {
    const pipe = new ExpiredMonthYearPipe();
    expect(pipe.transform('11/2022')).toEqual('11/2022');
  });
});
