const fs = require('fs-extra');
const child_process = require('child_process');

module.exports = argv => {
  if (fs.existsSync('build.json')) {
    const build = JSON.parse(fs.readFileSync('build.json'));
    if (fs.existsSync('packages')) {
      fs.removeSync('packages');
    }
    fs.mkdirSync('packages');
    let opt = {};
    if (argv.verbose) {
      opt = {stdio: 'inherit'};
    }
    for (let x in build.dependencies) {
      child_process.spawnSync('git', ['clone', '--depth=1', build.dependencies[x], 'packages/' + x], opt);
    }
  } else {
    throw new Error('No build.json Found');
  }
};
