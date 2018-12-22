const request = require('request');
const lzma = require('lzma-native');
const tar = require('tar');
const fs = require('fs');
const child_process = require('child_process');

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

  console.log('Downloading CrystaX NDK');

  fs.mkdirSync('build/ndk');
  const ndkVer = '10.3.2';
  await new Promise((resolve, reject) => {
    let stream = request('https://www.crystax.net/download/crystax-ndk-' + ndkVer + '-' + sysPlatform + '-' + sysArch + '.tar.xz').pipe(fs.createWriteStream('build/ndk/ndk.tar.xz'));
    stream.on('finish', () => {
      resolve();
    });
  });

  console.log('Extracting CrystaX NDK');

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

  console.log('Making Standalone Toolchain');

  let opt = {};
  if (verbose) {
    opt = {stdio: 'inherit'};
  }
  child_process.spawnSync(ndkPath + '/build/tools/make-standalone-toolchain.sh', ['--arch=' + arch, '--platform=android-21', '--install-dir=build/ndk/toolchain'], opt);

  if (!fs.existsSync('build/ndk/toolchain')) {
    throw new Error('Stansalone Toolchain Not Generated');
  }

  let target = '';
  if (arch === 'arm') {
    target = 'arm-linux-androideabi';
  } else if (arch === 'arm64') {
    target = 'aarch64-linux-android';
  } else if (arch === 'x86') {
    target = 'i686-linux-android';
  } else if (arch === 'x86_64') {
    target = 'x86_64-linux-android';
  } else if (arch === 'mips') {
    target = 'mipsel-linux-android';
  } else if (arch === 'mips64') {
    target = 'mips64el-linux-android';
  }

  let bin = process.cwd() + '/build/ndk/toolchain/bin/';

  return {
    target: target,
    make: {
      AR: bin + target + '-ar',
      AS: bin + target + '-gcc',
      CC: bin + target + '-gcc',
      CXX: bin + target + '-g++',
      LD: bin + target + '-ld',
      STRIP: bin + target + '-strip',
      CFLAGS: '-fPIE -fPIC',
      LDFLAGS: '-pie'
    },
    cmake: {
      CMAKE_C_COMPILER: bin + target + '-gcc',
      CMAKE_CXX_COMPILER: bin + target + '-g++',
      CMAKE_C_FLAGS: '-fPIE -fPIC'
    }
  };
};
