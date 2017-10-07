import generateStaticNames from './static-names';
import generateStaticRules from './static-rules';
import generateDefine from './define';
import generateCustomRules from './custom-rules';
import generateAlias from './alias';
import generateCssImport from './css-import';
import generateFactory from './factory';
import { sheetName } from '../utils';

export default (compilation, builder, root) => {
  const prefix = compilation.opts.prefix || 'export';
  builder('function $noop(){}\n\n');
  builder(`${prefix} function ${sheetName}($createStatic, $generateName, $instance, $define, $alias, $cssImport) {\n`, root);
  [
    generateStaticNames,
    generateStaticRules,
    generateDefine,
    generateCustomRules,
    generateAlias,
    generateCssImport,
    generateFactory,
  ].forEach((fun) => {
    fun(compilation, builder, root);
  });
  builder('}', root);
};
