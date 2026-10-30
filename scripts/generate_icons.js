import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, getPixel) {
  const bytesPerPixel = 4;
  const rawData = Buffer.alloc(height * (width * bytesPerPixel + 1));

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdr);

  // IDAT Chunk
  const idatChunk = createChunk('IDAT', compressed);

  // IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crcTable = getCrcTable();
  let crc = 0xffffffff;
  for (let i = 4; i < 8 + len; i++) {
    crc = crcTable[(crc ^ chunk[i]) & 0xff] ^ (crc >>> 8);
  }
  crc = crc ^ 0xffffffff;
  chunk.writeInt32BE(crc, 8 + len);

  return chunk;
}

let crcTableCache = null;
function getCrcTable() {
  if (crcTableCache) return crcTableCache;
  const c = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let curr = n;
    for (let k = 0; k < 8; k++) {
      if (curr & 1) {
        curr = 0xedb88320 ^ (curr >>> 1);
      } else {
        curr = curr >>> 1;
      }
    }
    c[n] = curr;
  }
  crcTableCache = c;
  return c;
}

const iconsDir = path.resolve('icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const sizes = [16, 32, 48, 128];

for (const size of sizes) {
  const pngBuffer = createPNG(size, size, (x, y, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = w * 0.44;

    // Rounded app icon shape
    const cornerR = w * 0.22;
    const innerX = Math.max(0, Math.abs(dx) - (cx - cornerR));
    const innerY = Math.max(0, Math.abs(dy) - (cy - cornerR));
    const cornerDist = Math.sqrt(innerX * innerX + innerY * innerY);

    if (cornerDist > cornerR) {
      return [0, 0, 0, 0]; // Transparent outside squircle
    }

    // Inside squircle: Background is deep dark #141517
    // Draw "CHZZK" glowing style lightning / C shape in neon green #00FFA3
    const nx = x / w;
    const ny = y / h;

    // Center circular badge with neon ring
    const ringDist = Math.abs(dist - w * 0.26);
    if (ringDist < w * 0.08) {
      // Neon green ring
      return [0, 255, 163, 255];
    }

    // Center broadcast dot
    if (dist < w * 0.12) {
      return [0, 255, 163, 255];
    }

    // Top-right notification dot indicator
    const trDx = x - (w * 0.78);
    const trDy = y - (h * 0.22);
    if (Math.sqrt(trDx * trDx + trDy * trDy) < w * 0.12) {
      return [0, 255, 163, 255];
    }

    return [20, 21, 23, 255]; // Deep dark background #141517
  });

  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), pngBuffer);
  console.log(`Generated icon${size}.png`);
}
