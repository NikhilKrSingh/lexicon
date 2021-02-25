import { JurisdictionMatterStateDisplayPipe } from './jurisdiction-matter-state-display.pipe';

let jurisdictionStateListMock = [
  {
    id: 101,
    name: 'Alabama'
  },
  {
    id: 102,
    name: ''
  },  
]
describe('JurisdictionMatterStateDisplayPipe', () => {
  it('create an instance', () => {
    const pipe = new JurisdictionMatterStateDisplayPipe();
    expect(pipe).toBeTruthy();
  });

  it('filter state name by jurisdictionstateId', () => {
    const pipe = new JurisdictionMatterStateDisplayPipe();
    expect(pipe.transform(jurisdictionStateListMock, jurisdictionStateListMock[0].id)).toEqual('Alabama');
  });

  it('filter state name by jurisdictionstateId if jurisdictionstateId blank should return blank', () => {
    const pipe = new JurisdictionMatterStateDisplayPipe();
    expect(pipe.transform(jurisdictionStateListMock, 103)).toEqual('');
  });
});
