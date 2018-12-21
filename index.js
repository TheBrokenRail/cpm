const install = require('./install');
const build = require('./build');

const yargs = require('yargs').command('build [system] [arch]', 'Build Project', yargs => {
  yargs.positional('system', {
    describe: 'Compile Target',
    default: 'host'
  }).positional('arch', {
    describe: 'Compile Arch',
    default: 'host'
  });
}, argv => {
  build(argv);
}).command('install', 'Install Project Dependencies', () => {}, argv => {
  install(argv);
}).option('verbose', {
  alias: 'v',
  default: false
}).demandCommand(1, 'No Command Specified').help().argv;
