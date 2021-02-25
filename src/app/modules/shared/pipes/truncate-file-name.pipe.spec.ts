import { TruncateFileNamePipe } from './truncate-file-name.pipe';

describe('TruncateFileNamePipe', () => {
  it('create an instance', () => {
    const pipe = new TruncateFileNamePipe(null);
    expect(pipe).toBeTruthy();
  });
});
