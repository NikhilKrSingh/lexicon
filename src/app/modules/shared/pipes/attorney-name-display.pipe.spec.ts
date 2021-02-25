import { AttorneyNameDisplayPipe } from './attorney-name-display.pipe';

let userMock = {
  lastName: 'Toast',
  firstName: 'Alex'
};

let userMockBlank = {
  lastName: '',
  firstName: ''
};

describe('AttorneyNameDisplayPipe', () => {
  it('create an instance', () => {
    const pipe = new AttorneyNameDisplayPipe();
    expect(pipe).toBeTruthy();
  });

  it('if attorney name is found return full name by lastname, firstname', () => {
    const pipe = new AttorneyNameDisplayPipe();
    expect(pipe.transform(userMock)).toEqual('Toast, Alex');
  });

  it('if attorney name null should return N/A', () => {
    const pipe = new AttorneyNameDisplayPipe();
    expect(pipe.transform(userMockBlank)).toEqual('N/A');
  });

  it('if user object null should return N/A', () => {
    const pipe = new AttorneyNameDisplayPipe();
    expect(pipe.transform(null)).toEqual('N/A');
  });
});
