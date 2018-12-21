const fs = require('fs-extra');
const targets = require('./targets/index');

module.exports = async argv => {
  if (fs.existsSync('build')) {
    fs.removeSync('build');
  }
  fs.mkdirSync('build');
  if (targets[argv.system]) {
    let target = await targets[argv.system](argv.arch, argv.verbose);
  } else {
    throw new Error('Invalid System');
  }
};
