import { GetSanitizeUrlPipe } from './get-sanitize-url.pipe';

describe('GetSanitizeUrlPipe', () => {
  it('create an instance', () => {
    const pipe = new GetSanitizeUrlPipe(null);
    expect(pipe).toBeTruthy();
  });
});
