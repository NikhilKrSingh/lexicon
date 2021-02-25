import { SliceByLengthPipe } from './slice-by-length.pipe';

describe('SliceByLengthPipe', () => {
  it('create an instance', () => {
    const pipe = new SliceByLengthPipe();
    expect(pipe).toBeTruthy();
  });

  it('Slice text by length', () => {
    const pipe = new SliceByLengthPipe();
    expect(pipe.transform('Months', 1)).toEqual('Month');
  });

  it('Slice text by length', () => {
    const pipe = new SliceByLengthPipe();
    expect(pipe.transform('Months', 2)).toEqual('Months');
  });
});
