import postcss from 'postcss';

export const MESSAGES = Symbol('messages');

export default postcss.plugin('postcss-runtime', () => {
  return (root, result) => {
    root[MESSAGES] = result.messages;
  };
});
