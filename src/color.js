import Color from 'color';

export default function(color, ...mods) {
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

export function deg(value) {
  return {
    type: deg,
    value: value,
  };
}

export function grad(value) {
  return {
    type: grad,
    value: value,
  };
}

export function rad(value) {
  return {
    type: rad,
    value: value,
  };
}

export function turn(value) {
  return {
    type: turn,
    value: value,
  };
}

/**
 * https://drafts.csswg.org/css-color/#typedef-color-adjuster
 */

export function red() {
  // TODO
  return (color) => color;
}

export function green() {
  // TODO
  return (color) => color;
}

export function blue() {
  // TODO
  return (color) => color;
}

export function alpha() {
  // TODO
  return (color) => color;
}

export function rgb() {
  // TODO
  return (color) => color;
}

export function hue() {
  // TODO
  return (color) => color;
}

export function saturation() {
  // TODO
  return (color) => color;
}

export function lightness() {
  // TODO
  return (color) => color;
}

export function whiteness() {
  // TODO
  return (color) => color;
}

export function blackness() {
  // TODO
  return (color) => color;
}

export function tint(percentage) {
  return blend('white', percentage);
}

export function shade(percentage) {
  return blend('black', percentage);
}

export function blend(other, percentage) {
  other = new Color(other);
  percentage = percentage.value;
  return (color) => color.mix(other, percentage);
}

export function blenda(other, percentage) {
  // TODO
  return (color) => color;
}

export function contrast(percentage = percentage(100)) {
  return (color) => {

  };
}
