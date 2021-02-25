import { CorporateContactExistPipe } from './corporate-contact-exist.pipe';

let corporateContactListMock = [{
  isPrimary: true,
}, {
  isBilling: true,
}];

let corporateContactListNotExistMock = [{
  isPrimary: false,
}, {
  isBilling: true,
}];

describe('CorporateContactExistPipe', () => {
  it('create an instance', () => {
    const pipe = new CorporateContactExistPipe();
    expect(pipe).toBeTruthy();
  });

  it('should check primary contact exist', () => {
    const pipe = new CorporateContactExistPipe();
    expect(pipe.transform(corporateContactListMock, 'Primary')).toEqual(true);
    expect(pipe.transform(corporateContactListMock, 'Billing')).toEqual(true);
  });

  it('should check primary contact exist', () => {
    const pipe = new CorporateContactExistPipe();
    expect(pipe.transform(corporateContactListNotExistMock, 'Primary')).toEqual(false);
  });
});
