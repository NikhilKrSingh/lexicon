import { GetContactFilterMapPipe } from './get-contact-filter-map.pipe';

let corporateContacts = [
  {
    name: 'primary contact Name',
    code : 'Primary Contact'
  },
  {
    name: 'Billing Contact Name',
    code : 'Billing Contact'
  },
  {
    name: 'General Counsel Name',
    code : 'General Counsel'
  }
];
describe('GetContactFilterMapPipe', () => {
  it('create an instance', () => {
    const pipe = new GetContactFilterMapPipe();
    expect(pipe).toBeTruthy();
  });

  it('contact name return based on type', () => {
    const pipe = new GetContactFilterMapPipe();
    expect(pipe.transform(corporateContacts, 'Primary Contact')).toContain('primary contact Name');
  });

});
