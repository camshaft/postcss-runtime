import Stringifier from './stringifier';

export function stringify(node, builder) {
  const str = new Stringifier(builder);
  return str.stringify(node);
}

export { Stringifier };
