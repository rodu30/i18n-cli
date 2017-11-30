#!/usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const recursiveReaddir = require('recursive-readdir');
const extractMessages = require('./extract');
const parseMessages = require('./parse');

const errorMsg = chalk.bold.red('Error');
const successMsg = chalk.bold.green('Success');
const statusMsg = curr => chalk.dim.gray(`[${curr}/3]`);

// --- message handling ---

/**
 * Returns true if file extension is 'js', 'ts' or 'jsx'
 * @param {string} filename
 */
const isJSFile = filename => {
  const extension = filename.split('.')[1];
  return extension === 'js' || extension === 'jsx' || extension === 'ts';
};

/**
 *
 * @param {array} files array of filenames within this directory
 * @param {string} marker name of the searched function
 */
const getMessages = (files, marker = 'i18n.translateMessage') => {
  console.log(`${statusMsg(1)} Reading files...`);
  // Filter js,jsx,ts files and extract messages from all of these files and return and array
  files = files.filter(isJSFile);
  return Promise.all(
    files.map(file =>
      readFile(file).then(data => {
        console.log(`${statusMsg(2)} Extracting from ${file}...`);
        return extractMessages(data, {
          marker,
        });
      })
    )
  );
};

/**
 * Builds correct messages object and writes it to JSON file
 * @param {array} rawMessages array of arrays with messages of every scanned file
 * @param {string} target directory where to save the messages file
 */
const writeMessages = (rawMessages, defaultLocale, target) => {
  const json = parseMessages(rawMessages);
  const targetPath = `${target || process.cwd()}/${defaultLocale}.json`;
  console.log(`${statusMsg(3)} Writing file...`);

  // TODO: Don't write message file, write file for specified message locale in order to keep translations
  return writeFile(targetPath, json);
};

// --- asynchronously file i/o ---

/**
 * Writes file asynchronously to provided or default location ('<cwd>/messages.json'),
 * if there already is a file with the same name it will be overwritten
 * @param {string} targetPath path and signature of target file
 * @param {object} data messages
 */
const writeFile = (path, data) => {
  return fs.writeFile(path, data, 'utf8', err => {
    if (err) throw err;
    console.log(`${successMsg} I18n messages saved to "${path}"!`);
  });
};

/**
 * readFile promise function
 * @param {*} srcFile
 */
const readFile = srcFile =>
  new Promise((resolve, reject) => {
    fs.readFile(srcFile, 'utf8', (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });

// /**
//    * readdir promise
//    * @param {*} srcDir
//    */
// const readDir = srcDir =>
//   new Promise((resolve, reject) => {
//     fs.readdir(srcDir, (err, files) => {
//       if (err) reject(err);
//       else resolve(files);
//     });
//   });

// --- parse command ---

program
  .version('0.1.0')
  .arguments('<srcPath> <defaultLocale> [targetPath]')
  // .option('-n, --ignore-namespace', 'Ignore all messages with the namespace option set')
  //   .option(
  //     '-e, --add-extension <extension>',
  //     'Add additional extension to be included in the search'
  //   )
  .option('-m, --marker <marker>', 'Set custom marker (default: i18n.translateMessage)')
  .action((srcPath, defaultLocale, targetPath) =>
    recursiveReaddir(srcPath)
      .then(files => getMessages(files, program.marker))
      .then(results => writeMessages(results, defaultLocale, targetPath))
      .catch(error => console.log(`${errorMsg} ${error}`))
  )
  .parse(process.argv);
