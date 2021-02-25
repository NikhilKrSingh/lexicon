import { SubstrByLengthPipe } from './substr-by-length.pipe';

describe('SubstrByLengthPipe', () => {
  it('create an instance', () => {
    const pipe = new SubstrByLengthPipe();
    expect(pipe).toBeTruthy();
  });

  it('substring length with provided length', () => {
    const pipe = new SubstrByLengthPipe();
    expect(pipe.transform('4111111111111111', 4)).toBeTruthy('1111');
  });
});
