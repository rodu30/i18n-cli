#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const recursiveReaddir = require('recursive-readdir');
const extractMessages = require('./extract');
const parseMessages = require('./parse');

// Formatted console output
const errorMsg = chalk.bold.red('Error');
const successMsg = chalk.bold.green('Success');
const statusMsg = curr => chalk.dim.gray(`[${curr}/3]`);

// --- asynchronously file i/o ---

/**
 * Writes file asynchronously to provided or default location,
 * if there already is a file with the same name it will be overwritten
 * @param {string} path path and signature of target file
 * @param {object} data messages
 */
const writeFile = (path, data) =>
  fs.writeFile(path, data, 'utf8', err => {
    if (err) throw err;
    console.log(`${successMsg} I18n messages saved to "${path}"!`);
  });

/**
 * Reads file from a path and returns data as promise
 * @param {string} filePath
 * @returns {string} data
 */
const readFile = filePath =>
  new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });

// --- message handling ---

/**
 * Returns true if file extension is 'js', 'ts' or 'jsx'
 * @param {string} filename
 * @returns {boolean}
 */
const isJSFile = filename => {
  const extension = filename.split('.')[1];
  return extension === 'js' || extension === 'jsx' || extension === 'ts';
};

/**
 * Extracts all messages and it's options that are passed as argument to a function
 * with the provided name (default is 'i18n.translateMessage'),
 * returns an array of arrays for every file as promise
 * @param {array} files array of filenames within this directory
 * @param {string} marker name of the searched function
 * @returns {array} raw messages
 */
const getMessages = (files, marker = 'i18n.translateMessage') => {
  console.log(`${statusMsg(1)} Reading files...`);
  // Filter js, jsx, ts files and extract messages from all of these files and return and array
  files = files.filter(isJSFile);
  return Promise.all(
    files.map(file =>
      readFile(file).then(data => {
        console.log(`${statusMsg(2)} Extracting from ${file}...`);
        const rawMessages = extractMessages(data, {
          marker,
        });
        return rawMessages.map(m => ({ ...m, file }));
      })
    )
  );
};

/**
 * Builds correct messages object for default locale and writes it to JSON file with locale`s name
 * @param {array} rawMessages array of arrays with messages of every scanned file
 * @param {string} target directory where to save the messages file
 */
const writeMessages = (rawMessages, defaultLocale, target) => {
  const json = parseMessages(rawMessages, defaultLocale);
  const targetPath = `${target || process.cwd()}/${defaultLocale}.json`;
  console.log(`${statusMsg(3)} Writing file...`);

  return writeFile(targetPath, json);
};

// --- parse command ---

program
  .version('0.1.0')
  .arguments('<srcPath> <defaultLocale> [targetPath]')
  .option('-m, --marker <marker>', 'Set custom marker (default: i18n.translateMessage)')
  .action((srcPath, defaultLocale, targetPath) =>
    recursiveReaddir(srcPath)
      .then(files => getMessages(files, program.marker))
      .then(results => writeMessages(results, defaultLocale, targetPath))
      .catch(error => console.log(`${errorMsg} ${error}`))
  )
  .parse(process.argv);
