const stringify = require('./sheet');

module.exports = (compilation, builder, root) => {
  const indent = '  ';
  let count = 0;
  let buffer = [];

  function clearBuffer(node) {
    if (!buffer.length) return;
    const name = `$staticChunk${count++}`;
    if (node) {
      node.staticChunk = name;
      builder(`${indent}const ${name} = $createStatic(\``, node, 'start');
    } else {
      builder(`${indent}$createStatic(\``, node, 'start');
    }
    buffer.forEach((node) => {
      stringify(node, builder);
    });
    builder('`);\n', node, 'end');
    buffer = [];
  }

  root.each((node) => {
    if (node.hasVar) return clearBuffer(node);
    buffer.push(node);
  });
  clearBuffer();

  if (!count) builder('  // no static rules\n\n');
  else builder('\n');
};
