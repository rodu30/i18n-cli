#!/usr/bin/env node

const program = require('commander');

const extract = require('./extract');
const merge = require('./merge');
const convert = require('./convert');

program.version('0.2.0');

program
  .command('extract <srcPath> <defaultLocale> [targetPath]')
  .alias('ext')
  .description(
    'Extracts messages from all code in a dir or a file and writes to JSON file (creates a new one if not existing)'
  )
  .option('-o, --no-output', 'No status output is displayed')
  .option('-f, --func-name <funcName>', 'Custom marker for search (default: i18n.m)')
  .action(extract);

program
  .command('merge <srcFile> <targetPath> [targetFile]')
  .alias('me')
  .description(
    'Merges messages from code with translations and adds flag if translation is missing or unused'
  )
  .option('-r, --report', 'Displays report of translation state after merging')
  .action(merge);

program
  .command('convert <srcPath> [targetPath]')
  .alias('con')
  .description(
    'Copies messages from one location to another and converts them from internal to external react-intl JSON format or the other way'
  )
  .option('-o, --out', 'Writes from source format to external format (default)')
  .option('-i, --in', 'Writes from external format to source format')
  .action(convert);

program.parse(process.argv);
