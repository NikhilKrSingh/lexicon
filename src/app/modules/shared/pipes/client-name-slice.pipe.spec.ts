import { ClientNameSlicePipe } from './client-name-slice.pipe';

describe('ClientNameSlicePipe', () => {
  it('create an instance', () => {
    const pipe = new ClientNameSlicePipe();
    expect(pipe).toBeTruthy();
  });

  it('shoud not slice client company name', () => {
    const pipe = new ClientNameSlicePipe();
    expect(pipe.transform({isCompany: true, companyName: 'companyName'}, 30)).toContain('companyName');
  });

  it('shoud slice client company name', () => {
    const pipe = new ClientNameSlicePipe();
    expect(pipe.transform({isCompany: true, companyName: 'client company firstname display'}, 30)).toContain('client company firstname displ...');
  });

  it('shoud client company name', () => {
    const pipe = new ClientNameSlicePipe();
    expect(pipe.transform({isCompany: true, companyName: undefined}, 30)).toBeNull();
  });

  it('shoud not slice client full name', () => {
    const pipe = new ClientNameSlicePipe();
    expect(pipe.transform({isCompany: false, firstName: 'firstName', lastName: 'lastName'}, 30)).toContain('firstName lastName');
  });

  it('shoud slice client full name', () => {
    const pipe = new ClientNameSlicePipe();
    expect(pipe.transform({isCompany: false, firstName: 'client firstname display', lastName: 'client lastname display'}, 30)).toContain('client firstname display clien...');
  });

  it('shoud client full name', () => {
    const pipe = new ClientNameSlicePipe();
    expect(pipe.transform({isCompany: false, firstName: undefined, lastName: undefined}, 30)).toBeNull();
  });
});
