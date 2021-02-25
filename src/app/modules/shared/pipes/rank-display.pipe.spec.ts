import { RankDisplayPipe } from './rank-display.pipe';

let rowMock = {
  rankingView: true,
  rank: 1
};

let rowfalseMock = {
  rankingView: true,
  rank: -1
};

let rowundefinedMock = {
  rankingView: undefined,
  rank: undefined
}

describe('RankDisplayPipe', () => {
  it('create an instance', () => {
    const pipe = new RankDisplayPipe();
    expect(pipe).toBeTruthy();
  });

  it('ranking view true and rank greater than 1 should return 1', () => {
    const pipe = new RankDisplayPipe();
    expect(pipe.transform(rowMock)).toEqual(1);
  });

  it('ranking view false should return -', () => {
    const pipe = new RankDisplayPipe();
    expect(pipe.transform(rowfalseMock)).toEqual('-');
  });

  it('undefined should return -', () => {
    const pipe = new RankDisplayPipe();
    expect(pipe.transform(undefined)).toEqual('-');
  });

  it('ranking view and rank undefined should return -', () => {
    const pipe = new RankDisplayPipe();
    expect(pipe.transform(rowundefinedMock)).toEqual('-');
  });
});
