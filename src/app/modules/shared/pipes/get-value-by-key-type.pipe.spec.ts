import { GetValueByKeyTypePipe } from './get-value-by-key-type.pipe';
let clientAddress = [
  {
    addressTypeId: 1,
    address: 'address 1',
    address2: 'address 2',
    city: 'city',
    zip: 'zip',
    state: 'Albama'
  }
];

let phoneMock = [
  {
    isPrimary: true,
    number: 1111111111
  },
  {
    isPrimary: false,
    number: 2222222222
  },
];

let attorneyMock = [
  {
    name: 'Responsible attorney'
  }
];


let attorneyNullMock = [
  {
    name: '',
  }
];

describe('GetValueByKeyTypePipe', () => {
  it('create an instance', () => {
    const pipe = new GetValueByKeyTypePipe();
    expect(pipe).toBeTruthy();
  });

  it('set primary address info', () => {
    const pipe = new GetValueByKeyTypePipe();
    expect(pipe.transform(clientAddress, 'addressTypeId', 1, 'address')).toEqual('address 1');
  });

  it('set primary and secondary phone info', () => {
    const pipe = new GetValueByKeyTypePipe();
    expect(pipe.transform(phoneMock, 'isPrimary', true, 'number')).toEqual(1111111111);
    expect(pipe.transform(phoneMock, 'isPrimary', false, 'number')).toEqual(2222222222);
  });

  it('set responsible attorney info', () => {
    const pipe = new GetValueByKeyTypePipe();
    expect(pipe.transform(attorneyMock, 'name', null, 'name')).toEqual('Responsible attorney');
  });

  it('set responsible attorney info', () => {
    const pipe = new GetValueByKeyTypePipe();
    expect(pipe.transform(attorneyNullMock, 'name', null, '')).toEqual('');
  });
});
