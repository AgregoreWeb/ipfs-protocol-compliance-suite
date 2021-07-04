#!/usr/bin/env node
/* eslint-disable no-template-curly-in-string */
// Requires IPFS tools to be installed in the path
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const fs = require('fs').promises

const FILES_TO_CONSTANTS = new Map([
  ['files', 'URL_IPFS_MEDIA'],
  ['files/example.txt', 'URL_IPFS_TEXT_FILE_RAW'],
  ['files/ipfs-logo.svg', 'URL_IPFS_IMAGE_FILE_RAW'],
  ['files/IPFS.mp4', 'URL_IPFS_VIDEO_FILE_RAW'],
  ['files/ipfs.mp3', 'URL_IPFS_AUDIO_FILE_RAW'],
  ['files/example.js', 'URL_IPFS_JS_FILE_RAW'],
  ['files/example.css', 'URL_IPFS_CSS_FILE_RAW'],
  ['files/example.html', 'URL_IPFS_HTML_FILE_RAW']
])

const CONSTANTS = new Map([
  ['URL_IPFS_TEXT_FILE', '${URL_IPFS_MEDIA}/example.txt'],
  ['URL_IPFS_IMAGE_FILE', '${URL_IPFS_MEDIA}/ipfs-logo.svg'],
  ['URL_IPFS_VIDEO_FILE', '${URL_IPFS_MEDIA}/IPFS.mp4'],
  ['URL_IPFS_AUDIO_FILE', '${URL_IPFS_MEDIA}/ipfs.mp3'],
  ['URL_IPFS_JS_FILE', '${URL_IPFS_MEDIA}/example.js'],
  ['URL_IPFS_JS_FILE_IMPORT', '${URL_IPFS_MEDIA}/js/import-example.js'],
  ['URL_IPFS_JS_FILE_IMPORT_DYNAMIC', '${URL_IPFS_MEDIA}/js/import-example-dynamic.js'],
  ['URL_IPFS_CSS_FILE', '${URL_IPFS_MEDIA}/example.css'],
  ['URL_IPFS_HTML_FILE', '${URL_IPFS_MEDIA}/example.html'],
  ['URL_IPFS_DIRECTORY_NO_INDEX', '${URL_IPFS_MEDIA}/no-index/'],
  ['URL_IPFS_DIRECTORY_WITH_INDEX', '${URL_IPFS_MEDIA}/with-index/'],
  ['URL_IPFS_DIRECTORY_WITH_FILE', '${URL_IPFS_MEDIA}/with-file/']
])

run().catch((e) => {
  process.nextTick(() => {
    throw e
  })
})

async function run () {
  console.log('Uploading to IPFS')
  const { stdout: output } = await exec('ipfs add ./files/ --cid-version=1 -r')

  const lines = output.split(/\r?\n/)

  const fileMap = new Map()

  for (const line of lines) {
    const [status, hash, path] = line.split(' ')
    if (!(status && hash && path)) continue
    fileMap.set(path, hash)
  }

  // console.log([...fileMap].map(([path, hash]) => `${path} ${hash}`).join('\n'))
  console.log('Generating constants file')

  let constantsFile = '// Constants for test files, generated with publish-files.js\n\n'

  constantsFile += '// Raw hashes\n'

  for (const [path, name] of FILES_TO_CONSTANTS) {
    const hash = fileMap.get(path)
    if (!hash) throw new Error('Missing file in published folder:' + path)
    const url = `ipfs://${hash}/`
    constantsFile += `const ${name} = '${url}'\n`
  }

  constantsFile += '\n// Relative paths\n'

  const BACKTIK = '`'

  for (const [name, path] of CONSTANTS) {
    constantsFile += `const ${name} = ${BACKTIK}${path}${BACKTIK}\n`
  }

  // console.log(constantsFile)

  await fs.writeFile('./constants.js', constantsFile)

  console.log('Wrote constants.js')

  const toPin = `ipfs://${fileMap.get('files')}`

  console.log('Please pin the following URL')
  console.log(toPin)
}
