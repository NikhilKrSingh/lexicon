import { TrustOnlyNumberDisplayPipe } from './trust-only-number-display.pipe';

let trustNumberMock = {
  name: 'Alex-Alex',
  trustNumber: 1
};

describe('TrustOnlyNumberDisplayPipe', () => {
  it('create an instance', () => {
    const pipe = new TrustOnlyNumberDisplayPipe();
    expect(pipe).toBeTruthy();
  });

  it('should return trust number with split', () => {
    const pipe = new TrustOnlyNumberDisplayPipe();
    expect(pipe.transform(trustNumberMock)).toEqual('Alex-Alex');
  });
});
