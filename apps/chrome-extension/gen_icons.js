#!/usr/bin/env node
// Generates solid-color PNG icons for the SIR extension.
// Run: node gen_icons.js
'use strict';

const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// SIR brand color — #6C63FF (108, 99, 255)
const R = 108, G = 99, B = 255;

function makeCRCTable() {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
}
const CRC_TABLE = makeCRCTable();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) | 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len     = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body    = Buffer.concat([typeBuf, data]);
  const crcBuf  = Buffer.alloc(4);
  crcBuf.writeInt32BE(crc32(body));
  return Buffer.concat([len, body, crcBuf]);
}

function makePNG(size) {
  // Raw image: each row = 1 filter byte + width*3 RGB bytes
  const rowLen  = size * 3;
  const imgData = Buffer.alloc(size * (rowLen + 1));
  for (let y = 0; y < size; y++) {
    const base = y * (rowLen + 1);
    imgData[base] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const p = base + 1 + x * 3;
      imgData[p]     = R;
      imgData[p + 1] = G;
      imgData[p + 2] = B;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8]  = 8; // bit depth
  ihdr[9]  = 2; // color type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(imgData, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

for (const size of [16, 48, 128]) {
  const file = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(file, makePNG(size));
  console.log(`✓ icons/icon${size}.png (${size}×${size})`);
}
console.log('Icons generated — SIR purple #6C63FF');
