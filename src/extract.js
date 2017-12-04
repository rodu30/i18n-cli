const recursiveReaddir = require('recursive-readdir');

const extractMessages = require('./extractMessages');
const parseMessages = require('./parseMessages');
const { writeFile, readFile } = require('./fileIO');
const { errorMsg, statusMsg, successMsg } = require('./formattedOutput');

/**
 * Returns true if file suffix is 'js', 'ts' or 'jsx'
 * @param {string} filename
 * @returns {boolean}
 */
const isJSFile = filename => {
  const suffix = filename.split('.')[1];
  return suffix === 'js' || suffix === 'jsx' || suffix === 'ts';
};

/**
 * Extracts all messages and it's options that are passed as argument to a function
 * with the provided name (default is 'i18n.translateMessage'),
 * returns an array of arrays for every file as promise
 * @param {array} files array of filenames within this directory
 * @param {string} marker name of the searched function
 * @returns {array} raw messages
 */
const getMessagesFromFiles = (files, marker = 'i18n.translateMessage', hasOutput) =>
  Promise.all(
    files.map(file =>
      readFile(file).then(data => {
        if (hasOutput) console.log(`${statusMsg(2)} Extracting from ${file}...`);
        const rawMessages = extractMessages(data, {
          marker,
        }).map(m => ({ ...m, file }));
        if (hasOutput) console.log(`...found ${rawMessages.length}`);
        return rawMessages;
      })
    )
  );

/**
 * Reads files in provided directory and extracts messages;
 * then parses these in the correct format and writes them to a (JSON) file for the provided locale
 * @param {string} srcPath
 * @param {string} defaultLocale
 * @param {string} targetPath
 * @param {object} options
 */
const extract = (srcPath, defaultLocale, targetPath, options) =>
  recursiveReaddir(srcPath)
    .then(files => {
      if (options.output) console.log(`${statusMsg(1)} Reading files...`);
      return getMessagesFromFiles(files.filter(isJSFile), options.funcName, options.output);
    })
    .then(results => {
      const json = parseMessages(results, defaultLocale);
      if (options.output) console.log(`${statusMsg(3)} Writing file...`);

      return writeFile(`${targetPath || process.cwd()}/${defaultLocale}.json`, json);
    })
    .then(path => console.log(`${successMsg}I18n messages saved to "${path}"!`))
    .catch(error => console.log(errorMsg + error));

module.exports = extract;
