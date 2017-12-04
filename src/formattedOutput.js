const chalk = require('chalk');

module.exports = {
  errorMsg: chalk.bold.red('Error '),
  successMsg: chalk.bold.green('Success '),
  statusMsg: curr => chalk.dim.gray(`[${curr}/3] `),
};
