const findInCode = require('../src/findInCode');

const rawCode = "<div>{i18n.m('foo', { description: 'bar' })}</div>";
const options = { marker: 'i18n.m' };

test('find in code', () => {
  expect(findInCode(rawCode, options)).toBeTruthy();
});
