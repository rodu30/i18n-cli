#!/usr/bin/env node

const program = require('commander');

const extract = require('./extract');
const merge = require('./merge');

program.version('0.1.0');

program
  .command('extract <srcPath> <defaultLocale> [targetPath]')
  .alias('ext')
  .description(
    'Extracts messages from all code in a dir or a file and writes to JSON file (creates a new one if not existing)'
  )
  .option('-o, --no-output', 'No status output is displayed')
  .option('-f, --func-name <funcName>', 'Custom marker for search (default: i18n.translateMessage)')
  .action(extract);

program
  .command('merge <srcFile> <targetPath> [targetFile]')
  .alias('me')
  .description(
    'Merges messages from code with translations and adds flag if translation is missing or unused'
  )
  .option('-r, --report', 'Displays report of translation state after merging')
  .action(merge);

program.parse(process.argv);
