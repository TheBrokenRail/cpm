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
  } else if (sysPlatform === 'linux') {
    sysPlatform = 'linux';
  } else if (sysPlatform === 'darwin') {
    sysPlatform = 'darwin';
  } else {
    throw new Error('Your OS Does Not Support The Android NDK');
  }
  if (sysArch === 'x86' && sysPlatform !== 'windows') {
    throw new Error('32-bit Ndk Is Only Supported on Windows');
  }
  const ndkVer = 'r18b'

  console.log('Downloading Android NDK');

  await new Promise((resolve, reject) => {
    let stream = request('https://dl.google.com/android/repository/android-ndk-' + ndkVer + '-' + sysPlatform + '-' + sysArch + '.zip').pipe(fs.createWriteStream('build/ndk/ndk.zip'));
    stream.on('finish', () => {
      resolve();
    });
  });

  console.log('Extracting Android NDK');

  let zip = new AdmZip('build/ndk/ndk.zip');
  zip.extractAllTo('build/ndk', true);
  const ndkPath = 'build/ndk/android-ndk-' + ndkVer;

  console.log('Making Standalone Toolchain');

  let opt = {};
  let extra = '';
  if (verbose) {
    opt = {stdio: 'inherit'};
    extra = '-v';
  }
  child_process.spawnSync('python', [ndkPath + '/build/tools/make_standalone_toolchain.py', '--arch', arch, '--api', '21', '--install-dir', 'build/ndk/toolchain', extra], opt);

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
  }

  let bin = process.cwd() + '/build/ndk/toolchain/bin/';

  return {
    target: target,
    make: {
      AR: bin + target + '-ar',
      AS: bin + target + '-clang',
      CC: bin + target + '-clang',
      CXX: bin + target + '-clang++',
      LD: bin + target + '-ld',
      STRIP: bin + target + '-strip',
      CFLAGS: '-fPIE -fPIC',
      LDFLAGS: '-pie'
    },
    cmake: {
      CMAKE_C_COMPILER: bin + target + '-clang',
      CMAKE_CXX_COMPILER: bin + target + '-clang++',
      CMAKE_C_FLAGS: '-fPIE -fPIC'
    }
  };
};
