import { PreferredContactPipe } from './preferred-contact.pipe';

describe('PreferredContactPipe', () => {

  const pipe = new PreferredContactPipe();

  it('Email Preferred Contact', () => {
    let item = {id: 1, preferredContactMethod: "Email", email: "abc@yopmail.com"};
    expect(pipe.transform(item)).toBe('abc@yopmail.com');
  });

  it('Email Preferred Call', () => {
    let item = {id: 1, preferredContactMethod: "Call", phones: [{id: 64517, number: "4234234234", type: "primary", isPrimary: true, personId: 9358}]};
    expect(pipe.transform(item)).toBe('4234234234');
  });

  it('Email Preferred Text', () => {
    let item = {id: 1, preferredContactMethod: "Text", phones: [{id: 64517, number: "4234234234", type: "primary", isPrimary: true, personId: 9358}]};
    expect(pipe.transform(item)).toBe('4234234234');
  });

  it('Email Preferred Cell', () => {
    let item = {id: 1, preferredContactMethod: "Cell", phones: [{id: 64517, number: "4234234234", type: "primary", isPrimary: true, personId: 9358}]};
    expect(pipe.transform(item)).toBe('4234234234');
  });
});
