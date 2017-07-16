import Color from 'color';

export function applyColorMods(color, ...mods) {
  if (!color) return color;
  return mods.reduce((acc, mod) =>
    mod(acc)
  , new Color(color));
}

export function percentage(value) {
  return {
    type: percentage,
    value: value / 100,
  };
}

function isPercentage(value) {
  return value && value.type == percentage;
}

export function deg(value) {
  return {
    type: deg,
    value: value,
  };
}

function isDeg(value) {
  return value && value.type == deg;
}

export function grad(value) {
  return {
    type: deg,
    value: value * 0.9,
  };
}

const radToDegrees = 180 / Math.PI;

export function rad(value) {
  return {
    type: deg,
    value: value * radToDegrees,
  };
}

export function turn(value) {
  return {
    type: deg,
    value: value * 360,
  };
}

export function parseNumber(value) {
  if (!value) return 0;
  return value.indexOf('%') != -1 ?
    parsePercentage(value) :
    parseFloat(value, 10);
}

export function parsePercentage(value) {
  return percentage(parseFloat(value, 10));
}

export function parseAngle(value) {
  // TODO add support for other units
  return deg(parseFloat(value, 10));
}

export function add(val, amount) {
  return val + amount;
}

export function sub(val, amount) {
  return val - amount;
}

export function mult(val, amount) {
  return val * amount;
}

export function set(val, amount) {
  return amount;
}

/**
 * https://drafts.csswg.org/css-color/#typedef-color-adjuster
 */

export const red = /*#__PURE__*/rgbaAdjuster('red');
export const green = /*#__PURE__*/rgbaAdjuster('green');
export const blue = /*#__PURE__*/rgbaAdjuster('blue');
export const alpha = /*#__PURE__*/rgbaAdjuster('alpha');

function rgbaAdjuster(prop) {
  return (modifier, amount) => {
    if (isPercentage(amount)) {
      amount = amount.value;
      if (modifier === set) {
        amount = amount * (prop === 'alpha' ? 1 : 255);
      } else if (modifier !== mult) {
        const parent = modifier;
        modifier = (prev) => parent(prev, prev * amount);
      }
    }
    return (color) => {
      const prev = color[prop]();
      return color[prop](modifier(prev, amount));
    };
  };
}

export function rgb() {
  // TODO
  return (color) => color;
}

export const hue = /*#__PURE__*/hslwbAdjuster('hue');
export const saturation = /*#__PURE__*/hslwbAdjuster('saturationl');
export const lightness = /*#__PURE__*/hslwbAdjuster('lightness');
export const whiteness = /*#__PURE__*/hslwbAdjuster('white');
export const blackness = /*#__PURE__*/hslwbAdjuster('wblack');

function hslwbAdjuster(prop, check) {
  return (modifier, amount) => {
    amount = isDeg(amount) ?
      amount.value : (
        isPercentage(amount) ?
          amount.value * 100 :
          amount
      );

    return (color) => color[prop](modifier(color[prop](), amount)).hsl()
  };
}

export function blend(other, percentage) {
  other = new Color(other);
  percentage = percentage.value;
  return (color) => {
    const alpha = color.alpha();
    return color
      .alpha(1)
      .mix(other, percentage)
      .alpha(alpha);
  };
}

export const tint = /*#__PURE__*/blend.bind(null, new Color('white'));
export const shade = /*#__PURE__*/blend.bind(null, new Color('black'));

export function blenda(other, percentage) {
  // TODO
  return (color) => color;
}

export function contrast(percentage = percentage(100)) {
  percentage = percentage.value;

  return (color) => {
    const max = color.luminosity() < 0.5 ?
      new Color({ h: color.hue(), w: 100, b: 0 }) :
      new Color({ h: color.hue(), w: 0, b: 100 });

    let min = max;

    if (color.level(max)) {
      min = binarySearchBWContrast(color, max);
      const alpha = min.alpha();
      min = min
        .alpha(1)
        .mix(max, percentage)
        .alpha(alpha);
    }

    return min.hsl();
  };
}

function binarySearchBWContrast(color, max) {
  let min = color;
  let minW = min.white();
  let minB = min.wblack();
  let maxW = max.white();
  let maxB = max.wblack();
  while (Math.abs(minW - maxW) > 1 || Math.abs(minB - maxB) > 1) {
    const midW = Math.round((maxW + minW) / 2);
    const midB = Math.round((maxB + minB) / 2);

    min = min
      .white(midW)
      .wblack(midB);

    if (min.level(color)) {
      maxW = midW;
      maxB = midB;
    } else {
      minW = midW;
      minB = midB;
    }
  }
  return min
}
