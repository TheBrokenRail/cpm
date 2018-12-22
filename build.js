const fs = require('fs-extra');
const targets = require('./targets/index');

const build = (target, prefix, package) => {
  console.log(target);
};

module.exports = async argv => {
  if (fs.existsSync('build')) {
    fs.removeSync('build');
  }
  fs.mkdirSync('build');
  if (targets[argv.system]) {
    let target = await targets[argv.system](argv.arch, argv.verbose);
    const prefix = process.cwd() + '/build/prefix';
    fs.mkdirSync(prefix);

    let files = fs.readdirSync('packages');
    for (let i = 0; i < packages.length; i++) {
      build(target, prefix, process.cwd() + '/packages/' + files[i]);
    }
  } else {
    throw new Error('Invalid System');
  }
};
