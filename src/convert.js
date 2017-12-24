const recursiveReaddir = require('recursive-readdir');

const { writeFile, readFile } = require('./fileIO');
const { errorMsg, successMsg } = require('./formattedOutput');

const MISSING = 'MISSING';
const LOCALE_PATTERN = /[a-z]{2}-[A-Z]{2}\.json|JSON/;

/**
 * Converts an object from internal syntax to external syntax
 * @param {string} srcData
 * @returns {object}
 */
const parseToObj = srcData => {
  const srcMsgs = JSON.parse(srcData);
  const newMsgs = Object.entries(srcMsgs)
    .filter(([key, value]) => value.message && !value.flag)
    .reduce((newObj, [key, value]) => {
      newObj[key] = value.message;
      return newObj;
    }, {});
  return newMsgs;
};

/**
 * Converts an object from external syntax to internal syntax
 * @param {string} srcData
 * @returns {object}
 */
const parseFromObj = srcData => {
  const srcMsgs = JSON.parse(srcData);
  const newMsgs = Object.entries(srcMsgs).reduce((newObj, [key, value]) => {
    newObj[key] = {
      message: value || null,
      contexts: [],
      flag: value ? undefined : MISSING,
    };
    return newObj;
  }, {});
  return newMsgs;
};

/**
 * Reads files at src path and writes converted messages to target path with the same file name,
 * direction of conversion is specified via options, if no options are provided it tries to write to external format
 * @param {string} srcPath
 * @param {string} targetPath
 * @param {object} options
 */
const convert = (srcPath, targetPath, options) => {
  return recursiveReaddir(srcPath)
    .then(files => {
      // Filter files for locale pattern (eg 'en-US') and ignore src file
      const localeFiles = files.filter(f => f.match(LOCALE_PATTERN));
      // Read locale files, convert with src and write (overwrite) results back to locale file
      return Promise.all(
        localeFiles.map((f, i) =>
          readFile(f)
            .then(data => {
              let newMsgObj = undefined;
              // If options set to input parse from object to internal format
              if (options.in) {
                newMsgObj = parseFromObj(data);
              } else {
                newMsgObj = parseToObj(data);
              }
              // Write results to file
              const fileName = f.slice(f.lastIndexOf('/'));
              return writeFile(
                targetPath ? targetPath + fileName : process.cwd() + fileName,
                JSON.stringify(newMsgObj)
              );
            })
            .then(path => console.log(`${successMsg}I18n messages copied to "${path}"!`))
        )
      );
    })
    .catch(error => console.log(errorMsg + error));
};

module.exports = convert;
