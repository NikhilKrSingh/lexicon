import { PartyCounselWitnessNameDisplayPipe } from './party-counsel-witness-name-display.pipe';

let companyMock = [
  {
    isCompany: true,
    company: 'UnitTest'
  }
];

let nameMock = [
  {
    isCompany: true,
    company: 'UnitTest'
  },
  {
    isCompany: false,
    company: 'UnitTest',
    lastName: 'Alex',
    firstName: 'Toast',
  }
];

describe('PartyCounselWitnessNameDisplayPipe', () => {
  it('create an instance', () => {
    const pipe = new PartyCounselWitnessNameDisplayPipe();
    expect(pipe).toBeTruthy();
  });

  it('if company should return company name with array', () => {
    const pipe = new PartyCounselWitnessNameDisplayPipe();
    expect(pipe.transform(companyMock)).toEqual(['UnitTest']);
  });

  it('should return witness name with array', () => {
    const pipe = new PartyCounselWitnessNameDisplayPipe();
    expect(pipe.transform(nameMock)).toEqual(['UnitTest', 'Alex, Toast']);
  });

  it('should return blank array if array is null', () => {
    const pipe = new PartyCounselWitnessNameDisplayPipe();
    expect(pipe.transform(null)).toEqual([]);
  });
});
