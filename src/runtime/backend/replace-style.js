export default function createBackend(style, onChange) {
  return (rules) => {
    style.innerHTML = rules.join('\n');
    if (onChange) onChange();
  };
}
