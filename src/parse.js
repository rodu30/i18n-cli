/**
 * Generates a key from a given message and an optional namespace string
 * @param {string} message
 * @param {string} namespace
 * @returns {string} generated key
 */
// TODO: should be imported from i18n-kit
const generateKey = (message, namespace) => {
  const key = message.toLowerCase().replace(/ /g, '_');
  // TODO: add more RegEx to remove special characters + make keys shorter (= better performance)
  if (namespace) return namespace.toLowerCase().concat('.', key);
  return key;
};

/**
 * Reduces message array to the final format and deals with duplicates;
 * returns an object with the message-key as key
 * and an object as value that contains:
 *  - the message
 *  - the state (only used in 'merge')
 *  - the contexts of the message,
 *    context is an array of objects with the file, the line and an optional description for the message,
 *    if message has duplicates it will contain this infos for every appearance
 * @param {array} messages
 * @returns {object} formatted messages
 */
const format = messages =>
  messages.reduce((obj, { key, message, file, line, column, description, state }) => {
    // If message key already exists compare with current
    if (obj[key]) {
      const fileExists = obj[key].contexts.find(c => c.file === file);
      const locExists = obj[key].contexts.find(c => c.line === line && c.column === column);
      // If duplicate is in different file or on different location in the same file add additional context
      if (!fileExists || (fileExists && !locExists)) {
        obj[key].contexts.push({ file, line, column, description });
      }
      // Otherwise duplicate will be removed
    } else {
      obj[key] = {
        message,
        contexts: [{ file, line, column, description }],
        state,
      };
    }
    return obj;
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
        state: undefined,
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
const parse = (rawMessages, defaultLocale) =>
  JSON.stringify(format(clear(rawMessages, defaultLocale)));

module.exports = parse;
