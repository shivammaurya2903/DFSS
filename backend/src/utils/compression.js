const fs = require('fs');
const zlib = require('zlib');
const stream = require('stream');
const util = require('util');
const path = require('path');

const pipeline = util.promisify(stream.pipeline);

const COMPRESSIBLE_TYPES = [
  'text/plain', 'text/csv', 'application/json', 'text/xml', 'application/xml',
  'text/html', 'text/css', 'application/javascript', 'text/javascript', 'application/typescript',
  'text/x-c', 'text/x-c++', 'text/x-java-source', 'text/x-python', 'text/markdown',
  'application/sql', 'application/pdf', 'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];

const COMPRESSIBLE_EXTENSIONS = [
  '.txt', '.csv', '.json', '.xml', '.html', '.css', '.js', '.ts', '.tsx', '.c', '.cpp', '.java', '.py', '.md', '.log', '.sql',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'
];

function isPotentiallyCompressible(mimeType, originalName) {
  if (COMPRESSIBLE_TYPES.includes(mimeType)) return true;
  const ext = path.extname(originalName).toLowerCase();
  if (COMPRESSIBLE_EXTENSIONS.includes(ext)) return true;
  return false;
}

async function compressFile(inputPath, outputPath) {
  await pipeline(
    fs.createReadStream(inputPath),
    zlib.createGzip({ level: 6 }),
    fs.createWriteStream(outputPath)
  );
}

module.exports = {
  isPotentiallyCompressible,
  compressFile
};
