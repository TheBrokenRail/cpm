const AdmZip = require('adm-zip');
const request = require('request');
const child_process = require('child_process');
const fs = require('fs');

module.exports = async (arch, verbose) => {
  const archs = ['arm', 'arm64', 'x86', 'x86_64'];
  if (!archs.includes(arch)) {
    throw new Error('Invalid Arch');
  }
  let sysArch = process.arch;
  if (sysArch === 'x32') {
    sysArch = 'x86';
  } else if (sysArch === 'x64') {
    sysArch = 'x86_64';
  } else if (sysArch === 'ia32') {
    sysArch = 'x86';
  } else {
    throw new Error('Your OS Does Not Support The Android NDK');
  }
  let sysPlatform = process.platform;
  if (sysPlatform === 'win32') {
    sysPlatform = 'windows';
  } else if (sysArch === 'linux') {
    sysPlatform = 'linux';
  } else if (sysArch === 'darwin') {
    sysPlatform = 'darwin';
  } else {
    throw new Error('Your OS Does Not Support The Android NDK');
  }
  if (sysArch === 'x86' && sysPlatform !== 'windows') {
    throw new Error('32-bit Ndk Is Only Supported on Windows');
  }
  const ndkVer = 'r18b'

  await new Promise((resolve, reject) => {
    let stream = request('https://dl.google.com/android/repository/android-ndk-' + ndkVer + '-' + sysPlatform + '-' + sysArch + '.zip').pipe(fs.createWriteStream('build/ndk/ndk.zip'));
    stream.on('finish', () => {
      resolve();
    });
  });
  let zip = new AdmZip('build/ndk/ndk.zip');
  zip.extractAllTo('build/ndk', true);
  const ndkPath = 'build/ndk/android-ndk-' + ndkVer;

  let opt = {};
  let extra = '';
  if (verbose) {
    opt = {stdio: 'inherit'};
    extra = '-v';
  }
  child_process.spawnSync('python', [ndkPath + '/build/tools/make_standalone_toolchain.py', '--arch', arch, '--api', '21', '--install-dir', 'build/ndk/toolchain', extra], opt);
};
