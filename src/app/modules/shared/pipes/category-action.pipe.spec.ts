import { CategoryActionPipe } from './category-action.pipe';

describe('CategoryActionPipe', () => {
  const pipe = new CategoryActionPipe();

  it('transforms "Matter" to "View Matter"', () => {
    expect(pipe.transform('Matter')).toBe('View Matter');
  });
  it('transforms "Matters" to "View Matter"', () => {
    expect(pipe.transform('Matters')).toBe('View Matter');
  });
  it('transforms "Matter Ledger" to "View Matter"', () => {
    expect(pipe.transform('Matter Ledger')).toBe('View Matter');
  });
  it('transforms "Client" to "View Client"', () => {
    expect(pipe.transform('Client')).toBe('View Client');
  });
  it('transforms "Potential Client" to "View Potential Client"', () => {
    expect(pipe.transform('Potential Client')).toBe('View Potential Client');
  });
  it('transforms "Potential Clients" to "View Potential Client"', () => {
    expect(pipe.transform('Potential Clients')).toBe('View Potential Client');
  });
  it('transforms "Employee" to "View Employee"', () => {
    expect(pipe.transform('Employee')).toBe('View Employee');
  });
  it('transforms "Calendar" to "View Calendar"', () => {
    expect(pipe.transform('Calendar')).toBe('View Calendar');
  });
  it('transforms "Office" to "View Office"', () => {
    expect(pipe.transform('Office')).toBe('View Office');
  });
  it('transforms "Profile Billing" to "View Billing"', () => {
    expect(pipe.transform('Profile Billing')).toBe('View Billing');
  });
  it('transforms "Pre Bill" to "View Pre-Bill"', () => {
    expect(pipe.transform('Pre Bill')).toBe('View Pre-Bill');
  });
  it('transforms "Calendar Event" to "View Calendar"', () => {
    expect(pipe.transform('Calendar Event')).toBe('View Calendar');
  });
  it('transforms "Timesheet" to "View Timesheet"', () => {
    expect(pipe.transform('Timesheet')).toBe('View Timesheet');
  });
  it('transforms "JobFamily" to "Edit Job Family"', () => {
    expect(pipe.transform('JobFamily')).toBe('Edit Job Family');
  });
  it('transforms "DMS Path" to "View Document"', () => {
    expect(pipe.transform('DMS Path')).toBe('View Document');
  });
  it('transforms "DMS Matter Folder" to "View Document"', () => {
    expect(pipe.transform('DMS Matter Folder')).toBe('View Document');
  });
});
