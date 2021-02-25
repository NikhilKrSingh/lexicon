import { GetDocIconPipe } from './get-doc-icon.pipe';

describe('GetDocIconPipe', () => {
  it('create an instance', () => {
    const pipe = new GetDocIconPipe();
    it('transforms "pdf" to "../../../../../../assets/images/dms/pdffilled.svg"', () => {
      expect(pipe.transform('pdf')).toBe('../../../../../../assets/images/dms/pdffilled.svg');
    });

    it('transforms "xlsx" to "../../../../../../assets/images/dms/excel.png"', () => {
      expect(pipe.transform('xlsx')).toBe('../../../../../../assets/images/dms/excel.png');
    });

    it('transforms "rtf" to "../../../../../../assets/images/dms/worddoc.png"', () => {
      expect(pipe.transform('rtf')).toBe('../../../../../../assets/images/dms/worddoc.png');
    });

    it('transforms "ppt" to "../../../../../../assets/images/dms/powerpoint.png"', () => {
      expect(pipe.transform('pdf')).toBe('../../../../../../assets/images/dms/powerpoint.png');
    });

    it('transforms "pdf" to "../../../../../../assets/images/dms/pdffilled.svg"', () => {
      expect(pipe.transform('pdf')).toBe('../../../../../../assets/images/dms/pdffilled.svg');
    });

  });
});
