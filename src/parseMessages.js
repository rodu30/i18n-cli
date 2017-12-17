/**
 * Generates a key from a message string
 * @param {string} message
 * @returns {string}
 */
const generateKey = message => {
  // NOTE: Using shorter keys (e.g. hashed values) can result in faster read times.
  //       However as long as there are no perf issues we will simply use the message as key.
  return message;
};

/**
 * Reduces message array to the final format and deals with duplicates;
 * returns an object with the message-key as key
 * and an object as value that contains:
 *  - the message
 *  - the flag (only used in 'merge')
 *  - the contexts of the message,
 *    context is an array of objects with the file, the line and an optional description for the message,
 *    if message has duplicates it will contain this infos for every appearance
 * @param {array} messages
 * @returns {object} formatted messages
 */
const format = messages =>
  messages.reduce((newObj, { key, message, file, line, column, description, flag }) => {
    // If message key already exists compare with current
    if (newObj[key]) {
      const fileExists = newObj[key].contexts.find(c => c.file === file);
      const locExists = newObj[key].contexts.find(c => c.line === line && c.column === column);
      // If duplicate is in different file or on different location in the same file add additional context
      if (!fileExists || (fileExists && !locExists)) {
        newObj[key].contexts.push({ file, line, column, description });
      }
      // Otherwise duplicate will be removed
    } else {
      newObj[key] = {
        message,
        contexts: [{ file, line, column, description }],
        flag,
      };
    }
    return newObj;
  }, {});

/**
 * Reduces and flatten raw messages, extract used value and removes non-default-locales
 * @param {array} messages
 * @param {string} defaultLocale
 * @returns {array} cleared messages
 */
const clear = (messages, defaultLocale) =>
  messages
    .reduce((a, b) => a.concat(b), [])
    .map(({ message, file, loc, options = {} }) => {
      const { description, messageLocale } = options;
      return {
        key: generateKey(message),
        message,
        messageLocale,
        file,
        line: loc.start.line,
        column: loc.start.column,
        description,
        flag: undefined,
      };
    })
    .filter(({ messageLocale }) => !messageLocale || messageLocale === defaultLocale);

/**
 * Parses raw messages to an JSON object in the required format
 * @param {array} rawMessages
 * @param {string} defaultLocale
 * @returns {object} messages JSON
 */
// TODO: set or ignore namespace ??
const parseMessages = (rawMessages, defaultLocale) =>
  JSON.stringify(format(clear(rawMessages, defaultLocale)));

module.exports = parseMessages;
