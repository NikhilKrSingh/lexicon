import { WorkingHoursPipe } from './working-hours.pipe';

describe('WorkingHoursPipe', () => {
  it('create an instance', () => {
    const pipe = new WorkingHoursPipe();
    expect(pipe).toBeTruthy();
  });
});
