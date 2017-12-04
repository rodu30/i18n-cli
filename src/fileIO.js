const fs = require('fs');

/**
 * Writes file asynchronously to provided or default location,
 * if there already is a file with the same name it will be overwritten
 * @param {string} filePath path and name of target file
 * @param {object} data messages
 */
const writeFile = (filePath, data) =>
  new Promise((resolve, reject) => {
    fs.writeFile(filePath, data, 'utf8', err => {
      if (err) reject(err);
      else resolve(filePath);
    });
  });

/**
 * Reads file asynchronously from a path and returns data as promise
 * @param {string} path
 * @returns {string} data
 */
const readFile = path =>
  new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });

module.exports = {
  writeFile,
  readFile,
};
