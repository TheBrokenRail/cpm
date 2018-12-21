const request = require('request');
const lzma = require('lzma-native');
const tar = require('tar');
const fs = require('fs');

module.exports = async (arch, verbose) => {
  const archs = ['arm', 'arm64', 'x86', 'x86_64', 'mips', 'mips64'];
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
  if (sysPlatform === 'linux') {
    sysPlatform = 'linux';
  } else if (sysPlatform === 'darwin') {
    sysPlatform = 'darwin';
  } else {
    throw new Error('Your OS Does Not Support The Android NDK');
  }

  const ndkVer = '10.3.2';
  await new Promise((resolve, reject) => {
    let stream = request('https://www.crystax.net/download/crystax-ndk-' + ndkVer + '-' + sysPlatform + '-' + sysArch + '.tar.xz').pipe(fs.createWriteStream('build/ndk/ndk.tar.xz'));
    stream.on('finish', () => {
      resolve();
    });
  });

  let decompressor = lzma.createDecompressor();
  let input = fs.createReadStream('build/ndk/ndk.tar.xz');
  let output = fs.createWriteStream('build/ndk/ndk.tar');

  await new Promise((resolve, reject) => {
    let stream = input.pipe(decompressor).pipe(output);
    stream.on('finish', () => {
      resolve();
    });
  });

  await tar.extract({
    file: 'build/ndk/ndk.tar',
    cwd: 'build/ndk'
  });

  const ndkPath = 'build/ndk/crystax-ndk-' + ndkVer;

  if (verbose) {
    opt = {stdio: 'inherit'};
    extra = '-v';
  }
  child_process.spawnSync(ndkPath + '/build/tools/make-standalone-toolchain.sh', ['--arch', arch, '--platform', 'android-21', '--install-dir', 'build/ndk/toolchain', extra], opt);
};
