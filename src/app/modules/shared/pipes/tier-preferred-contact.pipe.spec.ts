import { TierPreferredContactPipe } from './tier-preferred-contact.pipe';

let rowEmailMock = {
  preferredContactMethod: 'Email',
  email: 'unittestEmail@yopmail.com'
};

let rowTextMock = {
  preferredContactMethod: 'Text',
  email: 'unittestEmail@yopmail.com'
};

let rowCellMock = {
  preferredContactMethod: 'Cell',
  phones: ''
};

let rowCellExistMock = {
  preferredContactMethod: 'Cell',
  phones: [{
    isPrimary: true,
    number: 1111111111
  }]
};

let rowCellExistMock1 = {
  preferredContactMethod: 'Cell',
  phones: [{
    isPrimary: false,
    number: ''
  }]
};

let rowOtherMock = {
  preferredContactMethod: 'Celll',
  phones: ''
};

describe('TierPreferredContactPipe', () => {
  it('create an instance', () => {
    const pipe = new TierPreferredContactPipe();
    expect(pipe).toBeTruthy();
  });

  it('preferredContactMethod Email return email', () => {
    const pipe = new TierPreferredContactPipe();
    expect(pipe.transform(rowEmailMock, false)).toEqual('unittestEmail@yopmail.com');
  });

  it('preferredContactMethod Text and Phone is null return --', () => {
    const pipe = new TierPreferredContactPipe();
    expect(pipe.transform(rowTextMock, true)).toEqual('--');
  });

  it('preferredContactMethod Cell and Phone is null return --', () => {
    const pipe = new TierPreferredContactPipe();
    expect(pipe.transform(rowCellMock, false)).toEqual('--');
  });

  it('preferredContactMethod Cell and Phone is exist primary and return format', () => {
    const pipe = new TierPreferredContactPipe();
    expect(pipe.transform(rowCellExistMock, false)).toEqual('(111) 111-1111');
  });

  it('preferredContactMethod Cell, is exist primary and phone null return --', () => {
    const pipe = new TierPreferredContactPipe();
    expect(pipe.transform(rowCellExistMock1, false)).toEqual('-');
  });

  it('preferredContactMethod other return --', () => {
    const pipe = new TierPreferredContactPipe();
    expect(pipe.transform(rowOtherMock, false)).toEqual('--');
  });
});
