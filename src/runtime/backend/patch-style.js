import diff from 'generic-diff';

export default function createBackend(style, onChange) {
  const sheet = style.sheet;
  let prev;
  onChange = onChange || function() {};

  return (rules) => {
    const patches = prev ?
      diff(prev, rules) :
      [{ added: true, items: rules }];

    let idx = 0;

    for (let i = 0; i < patches.length; i++) {
      const { added, removed, items } = patches[i];

      if (added) {
        for (var j = 0; j < items.length; j++) {
          const rule = items[j];
          try {
            sheet.insertRule(rule, idx);
          } catch (e) {
            sheet.insertRule('.a{}', idx);
            console.warn(e);
          }
          idx++;
        }
        continue;
      }

      if (removed) {
        for (var j = 0; j < items.length; j++) {
          try {
            sheet.deleteRule(idx);
          } catch (e) {
            console.warn(e);
          }
        }
        continue;
      }

      idx += items.length;
    }

    prev = rules;
    onChange();
  };
}
