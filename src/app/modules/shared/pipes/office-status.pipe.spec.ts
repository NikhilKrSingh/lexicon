import { OfficeStatusPipe } from './office-status.pipe';

describe('OfficeStatusPipe', () => {
  const pipe = new OfficeStatusPipe();

  it('active status', () => {
    let status = "Active";
    let effectiveDate = "2019-04-01T00:00:00";
    expect(pipe.transform(effectiveDate, status)).toBe('Active');;
  });

  it('pending status', () => {
    let status = "Active";
    let effectiveDate = "2030-04-01T00:00:00";
    expect(pipe.transform(effectiveDate, status)).toBe('Pending');
  });
});
