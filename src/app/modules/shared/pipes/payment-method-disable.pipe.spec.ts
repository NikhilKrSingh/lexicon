import { PaymentMethodDisablePipe } from './payment-method-disable.pipe';

describe('PaymentMethodDisablePipe', () => {
  it('create an instance', () => {
    const pipe = new PaymentMethodDisablePipe();
    expect(pipe).toBeTruthy();
  });

  it('check credit card disabled', () => {
    const pipe = new PaymentMethodDisablePipe();
    expect(pipe.transform({code: 'CREDIT_CARD'}, {isCreditCardAccount: false})).toEqual(true);
  });

  it('check credit card disabled', () => {
    const pipe = new PaymentMethodDisablePipe();
    expect(pipe.transform({code: 'CREDIT_CARD'}, {isCreditCardAccount: false, isMerchantAccount: false})).toEqual(true);
  });

  it('check E check disabled', () => {
    const pipe = new PaymentMethodDisablePipe();
    expect(pipe.transform({code: 'E-CHECK'}, {isAchAccount: false})).toEqual(true);
  });
});
