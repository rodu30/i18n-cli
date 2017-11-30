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

const removeDuplicates = messages => {
  // Converting message array to an object with the message-key as key and an empty array as value
  const keysObj = messages.reduce((obj, item) => {
    obj[item.key] = item;
    return obj;
  }, {});
  // TODO: complete

  console.log(keysObj);
  return messages;
};

const parse = rawMessages => {
  // TODO:
  // - set or ignore namespace ??
  // - check message locale and and write to object ??
  // - generate keys
  // - remove duplicates
  // - parse to JSON
  const newMsgs = rawMessages.reduce((a, b) => a.concat(b), []).map(({ message, options = {} }) => {
    const { description } = options;
    return {
      key: generateKey(message),
      message,
      description,
      state: undefined,
    };
  });
  const cleanedMsgs = removeDuplicates(newMsgs);
  return JSON.stringify(cleanedMsgs);
};

module.exports = parse;
