const stringify = require('./sheet');

module.exports = (compilation, builder, root) => {
  const dependencies = Array
    .from(compilation.dependencies.values())
    .map(dep => `, ${dep}`)
    .join('');

  if (!dependencies.length) {
    return builder('    // no dynamic rules\n');
  }

  builder(`    $render(function($inject${dependencies}) {\n`);
  const indent = '      ';

  let buffer = [];
  function clearBuffer(node) {
    if (!buffer.length) return;
    const staticChunk = buffer[0].staticChunk;
    if (staticChunk) {
      builder(`${indent}$inject(${staticChunk});\n`, node);
    }

    builder(`${indent}$inject(\``, node, 'start');
    buffer.forEach((node) => {
      stringify(node, builder);
    });
    builder('`);\n', node, 'end');

    buffer = [];
  }

  root.each((node) => {
    if (!node.hasVar) return clearBuffer(node);
    buffer.push(node);
  });
  clearBuffer();

  builder(`    });\n`);
};
