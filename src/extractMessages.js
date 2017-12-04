// NOTE: most of this code is part of the '18n-extract' package (https://github.com/oliviertassinari/i18n-extract),
// because most of it's functions were not needed and this one is used it in a slightly different way then intended
// the package is not included as dependency

const { parse } = require('babylon');
const traverse = require('babel-traverse').default;
const chalk = require('chalk');

const noInformationTypes = ['CallExpression', 'Identifier', 'MemberExpression'];

/**
 * Gets the message from provided node
 * @param {object} node
 */
const getMessage = node => {
  if (node.type === 'StringLiteral') {
    return node.value;
  } else if (node.type === 'BinaryExpression' && node.operator === '+') {
    return getMessage(node.left) + getMessage(node.right);
  } else if (node.type === 'TemplateLiteral') {
    return node.quasis.map(quasi => quasi.value.cooked).join('*');
  } else if (noInformationTypes.includes(node.type)) {
    return '*'; // We can't extract anything.
  }

  console.warn(`${chalk.bold.red('Error')} Can't read unsupported message type: ${node.type}`);

  return null;
};

/**
 * Gets the options for a message from provided node
 * @param {object} node
 */
const getOptions = (node = {}) => {
  if (node.type === 'ObjectExpression') {
    return node.properties.reduce((obj, item) => {
      obj[item.key.name] = item.value.value;
      return obj;
    }, {});
  }

  return undefined;
};

const commentRegExp = /i18n-extract (.+)/;
const commentIgnoreRegExp = /i18n-extract-disable-line/;

/**
 * Takes the code and yields all messages from code using the babylon plugin
 * (which parses stringified code to a specific object format from which all sorts of expressions can be retrieved)
 * @param {string} code
 * @param {object} options
 */
const extractMessages = (code, options) => {
  const { marker, keyLoc = 0 } = options;

  const ast = parse(code, {
    sourceType: 'module',

    // Enable all the plugins
    plugins: [
      'jsx',
      'flow',
      'asyncFunctions',
      'classConstructorCall',
      'doExpressions',
      'trailingFunctionCommas',
      'objectRestSpread',
      'decorators',
      'classProperties',
      'exportExtensions',
      'exponentiationOperator',
      'asyncGenerators',
      'functionBind',
      'functionSent',
      'dynamicImport',
    ],
  });

  const messages = [];
  const ignoredLines = [];

  // Look for messages in the comments.
  ast.comments.forEach(comment => {
    let match = commentRegExp.exec(comment.value);
    if (match) {
      messages.push({
        key: match[1].trim(),
        loc: comment.loc,
      });
    }

    // Check for ignored lines
    match = commentIgnoreRegExp.exec(comment.value);
    if (match) {
      ignoredLines.push(comment.loc.start.line);
    }
  });

  // Look for messages in the source code.
  traverse(ast, {
    CallExpression(path) {
      const { node } = path;

      if (ignoredLines.includes(node.loc.end.line)) {
        // Skip ignored lines
        return;
      }

      const { callee: { name, type } } = node;

      if ((type === 'Identifier' && name === marker) || path.get('callee').matchesPattern(marker)) {
        const message = getMessage(
          keyLoc < 0 ? node.arguments[node.arguments.length + keyLoc] : node.arguments[keyLoc]
        );
        const options = getOptions(node.arguments[keyLoc + 1]);

        if (message) {
          messages.push({
            message,
            options,
            loc: node.loc,
          });
        }
      }
    },
  });

  return messages;
};

module.exports = extractMessages;
