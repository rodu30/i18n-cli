const Table = require('cli-table');
const recursiveReaddir = require('recursive-readdir');

const { writeFile, readFile } = require('./fileIO');
const { errorMsg, successMsg } = require('./formattedOutput');

const MISSING = 'MISSING';
const UNUSED = 'UNUSED';
const LOCALE_PATTERN = /[a-z]{2}-[A-Z]{2}\.json|JSON/;

const reportingTableProperties = {
  head: [' ', 'Total', 'Missing', 'Unused'],
  chars: {
    top: '═',
    'top-mid': '╤',
    'top-left': '╔',
    'top-right': '╗',
    bottom: '═',
    'bottom-mid': '╧',
    'bottom-left': '╚',
    'bottom-right': '╝',
    left: '║',
    'left-mid': '╟',
    mid: '─',
    'mid-mid': '┼',
    right: '║',
    'right-mid': '╢',
    middle: '│',
  },
};

/**
 * Gets total length of an object as string
 * @param {object} obj
 * @returns {string}
 */
const getTotal = obj => Object.keys(obj).length.toString();

/**
 * Gets the locale name from a path and removes suffix
 * @param {string} path
 * @returns {string}
 */
const getLocaleName = path => path.match(LOCALE_PATTERN)[0].split('.')[0];

/**
 * Copies a message object, removes the translated strings and adds a MISSING flag
 * @param {string} srcData
 * @returns {object}
 */
const getNew = srcData => {
  const msgObj = JSON.parse(srcData);
  Object.entries(msgObj).forEach(
    ([key, value]) =>
      (msgObj[key] = {
        ...value,
        message: null,
        flag: MISSING,
      })
  );
  return msgObj;
};

/**
 * Merges two message data strings (a src and a target) into a new target where missing and unused translations are flagged,
 * returns an array where the new object comes first and second an statistics object about the occurrence of missing and unused messages
 * @param {string} srcData
 * @param {string} targetData
 * @returns {array}
 */
const getMerged = (srcData, targetData) => {
  const srcMsgs = JSON.parse(srcData);
  const targetMsgs = JSON.parse(targetData);

  let missingCounter = 0;
  let unusedCounter = 0;

  // Find missing
  Object.entries(srcMsgs).forEach(([key, value]) => {
    if (!targetMsgs[key] || (targetMsgs[key] && !targetMsgs[key].message)) {
      // If key is not in file write empty message with MISSING flag
      targetMsgs[key] = {
        ...value,
        message: null,
        flag: MISSING,
      };
      missingCounter += 1;
    } else {
      // If key is in file remove flag (if any) and overwrite contexts (in case text was moved)
      targetMsgs[key] = {
        ...targetMsgs[key],
        contexts: value.contexts,
        flag: undefined,
      };
    }
  });

  // Find unused
  Object.entries(targetMsgs).forEach(([key, value]) => {
    // If key is not in file add UNUSED flag
    if (!srcMsgs[key]) {
      targetMsgs[key] = {
        ...targetMsgs[key],
        flag: UNUSED,
      };
      unusedCounter += 1;
    }
  });

  return [targetMsgs, { missing: missingCounter, unused: unusedCounter }];
};

/**
 * Reads src file and target file(s), writes new empty messages to target files for translation
 * and adds flags for state of the translation;
 * optional filename can be provided, in this case only this file will be merged or if it doesn't exist in dir it will be created
 * @param {string} srcFile
 * @param {string} targetPath
 * @param {string} targetFile
 * @param {object} options
 */
const merge = (srcFile, targetPath, targetFile, options) => {
  // If report option is set, init report
  let report = null;
  if (options.report) {
    report = new Table(reportingTableProperties);
  }

  readFile(srcFile)
    .then(srcData => {
      // Add default language to report
      if (report) {
        report.push([
          `${getLocaleName(srcFile)} (default)`,
          getTotal(JSON.parse(srcData)),
          '/',
          '/',
        ]);
      }

      // If a target file is provided...
      if (targetFile) {
        const targetFilePath = `${targetPath}/${targetFile}`;
        return readFile(targetFilePath).then(
          targetData => {
            // ...merge with this file
            const newMsgArr = getMerged(srcData, targetData);
            // Add to report and print
            if (report) {
              report.push([
                getLocaleName(targetFilePath),
                getTotal(newMsgArr[0]),
                newMsgArr[1].missing.toString(),
                newMsgArr[1].unused.toString(),
              ]);
              console.log(report.toString());
            }
            // Write results to file
            return writeFile(targetFilePath, JSON.stringify(newMsgArr[0])).then(path =>
              console.log(`${successMsg}I18n messages merged with "${path}"!`)
            );
          },
          err => {
            // ...and the target file does not exist create a new one from src data
            if (err.code === 'ENOENT') {
              const newMsgObj = getNew(srcData);
              // Add to report and print
              if (report) {
                report.push([
                  getLocaleName(targetFile),
                  getTotal(newMsgObj),
                  getTotal(newMsgObj),
                  '0',
                ]);
                console.log(report.toString());
              }
              // Write results to file
              return writeFile(targetFilePath, JSON.stringify(newMsgObj)).then(path =>
                console.log(`${successMsg}I18n messages saved to new locale "${path}"!`)
              );
            } else {
              // Print any other error
              console.log(errorMsg + err);
            }
          }
        );
      }

      // If only a directory is provided, merge with all files in it that match locale pattern and are not the src file
      return recursiveReaddir(targetPath)
        .then(files => {
          // Filter files for locale pattern (eg 'en-US') and ignore src file
          const localeFiles = files.filter(f => {
            const srcLocale = srcFile.match(LOCALE_PATTERN)[0];
            return f.match(LOCALE_PATTERN) && f.indexOf(srcLocale) === -1;
          });
          let count = 0;
          // Read locale files, merge with src and write (overwrite) results back to locale file
          return Promise.all(
            localeFiles.map((f, i) =>
              readFile(f)
                .then(data => {
                  const newMsgArr = getMerged(srcData, data);
                  // Add to report and print (when this is last file in array)
                  if (report) {
                    report.push([
                      getLocaleName(f),
                      getTotal(newMsgArr[0]),
                      newMsgArr[1].missing.toString(),
                      newMsgArr[1].unused.toString(),
                    ]);
                    count += 1;
                    if (count === localeFiles.length) console.log(report.toString());
                  }
                  // Write results to file
                  return writeFile(f, JSON.stringify(newMsgArr[0]));
                })
                .then(path => console.log(`${successMsg}I18n messages merged with "${path}"!`))
            )
          );
        })
        .catch(error => console.log(errorMsg + error));
    })
    .catch(error => console.log(errorMsg + error));
};

module.exports = merge;
