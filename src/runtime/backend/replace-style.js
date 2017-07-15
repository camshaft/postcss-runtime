import createTextBackend from './text';

export default function createBackend(style, onChange) {
  return createTextBackend((text) => {
    style.innerHTML = text;
    if (onChange) onChange();
  });
}
