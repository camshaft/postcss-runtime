import parser from 'postcss-values-parser';
import Color from 'color';

const colorMod = process.env.POSTCSS_RUNTIME_PATH || 'postcss-runtime';

/**
 * color: color(red shade(20%));
 */

export default function plugin(root, compilation) {
  root.walkDecls((rule) => {
    const value = rule.value;
    if (!value) return;

    value.walk((node) => {
      if (node.type === 'func' && (node.value === 'color' || node.value === 'color-mod')) {
        parseColor(node, compilation);
      }
    });
  });
}

function parseColor(fun, compilation) {
  fun.value = compilation.import(colorMod, 'applyColorMods');
  fun.unquote = true;

  const args = cleanArgs(fun);
  fun.removeAll();

  args.forEach((arg, i) => {
    if (i === 0) {
      const value = color(arg, compilation);
      if (!value) {
        throw new Error(`Invalid color value: ${String(arg)}`);
      }
      fun.append(value);
      return;
    }

    const value = adjusters(arg, compilation);
    if (value) {
      fun.append(value);
      return;
    }

    // TODO use postcss warnings
    console.error(`Invalid adjuster function: ${arg.toString()}`);
    return false;
  });
}

const rgba = choice(['red', 'green', 'blue', 'alpha', 'a'], (value) => {
  return value === 'a' ?
    'alpha' :
    value;
});

const hue = choice(['hue', 'h'], () => 'hue');
const saturation = choice(['saturation', 's'], () => 'saturation');
const lightness = choice(['lightness', 's'], () => 'lightness');
const whiteness = choice(['whiteness', 's'], () => 'whiteness');
const blackness = choice(['blackness', 's'], () => 'blackness');

const rgb = toCombinator('rgb');
const PLUS = operator('+');
const MINUS = operator('-');
const MULT = operator('*');
const colorSpaces = choice(['rgb', 'hsl', 'hwb']);

const ops = {
  '+': 'add',
  '-': 'sub',
  '*': 'mult',
};

const number = numberComb('parseNumber', '', (node, compilation) => {
  node.unquote = true;
});
const percentage = numberComb('parsePercentage', '%', (node, compilation) => {
  return callNumberFunction(node, compilation, 'percentage');
});
const angle = numberComb('parseAngle', ['', 'deg', 'grad', 'rad', 'turn'], (node, compilation) => {
  const unit = node.unit || 'deg';
  return callNumberFunction(node, compilation, unit);
});

const adjusters = choice([
  func(rgba, [
    option(choice([PLUS, MINUS, MULT])),
    choice([number, percentage]),
  ], (node, compilation, args) => {
    let name = node.value;
    const op = args[0];
    if (op) {
      op.value = compilation.import(colorMod, ops[op.value]);
      op.unquote = true;
    } else {
      args[0] = parser.word({
        value: compilation.import(colorMod, 'set'),
        unquote: true,
      });
    }

    node.value = compilation.import(colorMod, name);
    node.unquote = true;
    node.nodes = args;
  }),
  func(rgb, [
    choice([PLUS, MINUS]),
    option(choice([number, percentage])),
    option(choice([number, percentage])),
    option(choice([number, percentage])),
  ], (node, compilation, args) => {
    let name = node.value;
    const op = args[0];
    op.value = compilation.import(colorMod, ops[op.value]);
    op.unquote = true;

    node.value = compilation.import(colorMod, name);
    node.unquote = true;
    node.nodes = args;
  }),
  func(rgb, [
    choice([PLUS, MINUS]),
    // hashToken, // TODO
  ], (node, compilation, args) => {
    // TODO
  }),
  func(rgb, [
    MULT,
    percentage
  ], (node, compilation, args) => {
    const name = node.value + 'Mult';

    node.value = compilation.import(colorMod, name);
    node.unquote = true;
    node.nodes = args.slice(1);
  }),

  func(hue, [
    option(choice([PLUS, MINUS, MULT])),
    angle,
  ], hsl),
  func(saturation, [
    option(choice([PLUS, MINUS, MULT])),
    option(choice([number, percentage])),
  ], hsl),
  func(lightness, [
    option(choice([PLUS, MINUS, MULT])),
    option(choice([number, percentage])),
  ], hsl),
  func(whiteness, [
    option(choice([PLUS, MINUS, MULT])),
    option(choice([number, percentage])),
  ], hsl),
  func(blackness, [
    option(choice([PLUS, MINUS, MULT])),
    option(choice([number, percentage])),
  ], hsl),

  func('tint', [
    percentage,
  ], tintShade),
  func('shade', [
    percentage,
  ], tintShade),

  func('blend', [
    color,
    percentage,
    option(colorSpaces),
  ], blend),
  func('blenda', [
    color,
    percentage,
    option(colorSpaces),
  ], blend),

  func('contrast', [
    option(percentage),
  ], contrast),
]);

function cleanArgs(fun) {
  const args = [];

  fun.each((arg, i) => {
    const type = arg.type;
    if (type === 'string') {
      throw new Error(`Invalid color-mod argument: ${String(arg)}`);
    }
    if (type === 'func' ||
        type === 'number' ||
        type === 'operator' ||
        type === 'word') return args.push(arg.clone());
  });

  return args;
}

function isVariable(node) {
  return node && node.type === 'function' && node.value === 'var';
}

function toCombinator(value) {
  if (typeof value === 'function') return value;
  return (v) => v === value && value;
}

function choice(choices, transform = (v) => v) {
  choices = choices.map(toCombinator);
  return (value, compilation) => {
    for (let i = 0; i < choices.length; i++) {
      const res = choices[i](value, compilation);
      if (res) return (transform(res, compilation) || res);
    }
    return false;
  };
}

function word(name) {
  return (node) => {
    return node.type === 'word' && node.value === name && node;
  };
}

function operator(name) {
  return (node) => {
    return node.type === 'operator' && node.value === name && node;
  };
}

function func(name, argMatchers, transform = v => v) {
  name = toCombinator(name);
  argMatchers = argMatchers.map(toCombinator);
  return (node, compilation) => {
    if (!node || node.type !== 'func') return false;
    const value = name(node.value, compilation);
    if (!value) return false;
    node.value = value;
    const args = cleanArgs(node);

    let j = 0;
    const out = [];
    for (let i = 0; i < argMatchers.length; i++) {
      let res = argMatchers[i](args[j], compilation);
      if (!res) return false;
      if (res === option) {
        res = undefined;
      } else {
        j++;
      }
      out[i] = res;
    }

    node.removeAll();
    out.forEach(arg => arg && node.append(arg));

    return (transform(node, compilation, out) || node);
  };
}

function option(fun) {
  return (node, compilation) => {
    if (!node) return option;
    const value = fun(node, compilation);
    if (!value) return option;
    return value;
  };
}

function color(node, compilation) {
  const type = node.type;
  const value = node.value;
  if (type === 'func') {
    switch(value) {
      case 'color':
      case 'color-mod':
        return node;
      case 'var':
        return callNumberFunction(node, compilation, 'applyColorMods', false);
      case 'rgb':
      case 'rgba':
      case 'hsl':
      case 'hsla':
      case 'hsv':
      case 'hwb':
      case 'hcg':
      case 'cmyk':
      case 'xyz':
      case 'lab':
        // TODO convert into color([a, b, c], model)
        return callNumberFunction(node, compilation, 'applyColorMods', false);
      default:
        return false;
    }
  }

  if (type === 'word') {
    if (value === 'currentColor') return false;
    try {
      new Color(value);
    } catch (e) {
      return false;
    }
    return callNumberFunction(node, compilation, 'applyColorMods', false);
  }

  return false;
}

function callNumberFunction(node, compilation, name, unquote = true) {
  const call = parser.func({
    unquote: true,
    value: compilation.import(colorMod, name),
    source: node.source,
    sourceIndex: node.sourceIndex,
  });
  call.append(node.clone({
    unquote: unquote,
    unit: '',
  }));
  return call;
}

function numberComb(parser, unit = '', transform = v => v) {
  if (!Array.isArray(unit)) unit = [unit]
  return (node, compilation) => {
    if (isVariable(node)) {
      return callNumberFunction(node, compilation, parser);
    }
    return node &&
           node.type === 'number' &&
          ~unit.indexOf(node.unit) &&
          (transform(node, compilation) || node);
  };
}

function hsl(node, compilation, args) {
  let name = node.value;

  const op = args[0];
  if (op) {
    op.value = compilation.import(colorMod, ops[op.value]);
    op.unquote = true;
  } else {
    args[0] = parser.word({
      value: compilation.import(colorMod, 'set'),
      unquote: true,
    });
  }

  node.value = compilation.import(colorMod, name);
  node.unquote = true;
  node.nodes = args;
};

function tintShade(node, compilation, args) {
  node.value = compilation.import(colorMod, node.value);
  node.unquote = true;
}

function blend(node, compilation, args) {
  node.value = compilation.import(colorMod, node.value);
  node.unquote = true;
}

function contrast(node, compilation, args) {
  node.value = compilation.import(colorMod, node.value);
  node.unquote = true;
}
