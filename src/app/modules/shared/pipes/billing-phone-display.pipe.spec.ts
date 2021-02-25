import { BillingPhoneDisplayPipe } from './billing-phone-display.pipe';

let phoneMock = [
  {
    isPrimary: true,
    number: 1111111111
  }
];

let phonePrimaryFalseMock = [
  {
    isPrimary: false,
    number: 1111111111
  }
];

describe('BillingPhoneDisplayPipe', () => {
  it('create an instance', () => {
    const pipe = new BillingPhoneDisplayPipe();
    expect(pipe).toBeTruthy();
  });

  it('billing phone is primary should return name', () => {
    const pipe = new BillingPhoneDisplayPipe();
    expect(pipe.transform(phoneMock)).toEqual(1111111111);
  });

  it('billing phone array null should return blank', () => {
    const pipe = new BillingPhoneDisplayPipe();
    expect(pipe.transform(null)).toEqual('');
  });

  it('billing phone array find value should return blank', () => {
    const pipe = new BillingPhoneDisplayPipe();
    expect(pipe.transform(phonePrimaryFalseMock)).toEqual('');
  });
});
