#!/usr/bin/env node

const program = require('commander');
const fs = require('fs');
const recursiveReaddir = require('recursive-readdir');
const extractMessages = require('./extract');
const parseMessages = require('./parse');

/**
 * Returns true if file extension is 'js', 'ts' or 'jsx'
 * @param {string} filename
 */
const isJSFile = filename => {
  const extension = filename.split('.')[1];
  return extension === 'js' || extension === 'jsx' || extension === 'ts';
};

// --- asynchronously file i/o ---

const writeFile = (targetPath, data) => {
  const path = targetPath || 'messages.json';
  return fs.writeFile(path, data, 'utf8', err => {
    if (err) throw err;
    console.log('File "' + path + '" has been saved!');
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
      // const results = parse(find(data));
      // write(program.targetPath, results);
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
  .arguments('<src> [target] [marker]')
  .option('-n, --ignore-namespace', 'Ignore all messages with the namespace option set')
  //   .option(
  //     '-e, --add-extension <extension>',
  //     'Add additional extension to be included in the search'
  //   )
  // .option('-i, --ignore-files <dir>', 'Ignore files in directory')
  .action((src, target, marker = 'i18n.translateMessage') =>
    recursiveReaddir(src)
      .then(files => {
        // Filter js,jsx,ts files and extract messages from all of these files and return and array
        files = files.filter(isJSFile);
        return Promise.all(
          files.map(file =>
            readFile(file)
              .then(data => {
                // console.log(
                //   extractMessages(data, {
                //     marker: 'I18n',
                //     keyLoc: 0,
                //   })
                // );
                return extractMessages(data, {
                  marker,
                });
              })
              .catch(error => console.log(error))
          )
        );
      })
      .then(results => {
        const json = parseMessages(results.reduce((a, b) => a.concat(b), []));
        writeFile(target, json);
      })
      .catch(error => console.log(error))
  )
  .parse(process.argv);
