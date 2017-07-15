export default function createBackend(onChange) {
  return (rules) => {
    onChange(rules.join('\n'));
  };
}
