// Header inspection only. Flutter must still decode the image during QA.
export function dimensions(buffer) {
  if (buffer.length >= 24 && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && buffer.toString('ascii', 12, 16) === 'IHDR') {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), format: 'png' };
  }
  if (buffer.length >= 30 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buffer.toString('ascii', 12, 16);
    if (chunk === 'VP8X') return { width: buffer.readUIntLE(24, 3) + 1, height: buffer.readUIntLE(27, 3) + 1, format: 'webp' };
    if (chunk === 'VP8 ' && buffer.subarray(23, 26).equals(Buffer.from([157,1,42]))) return { width: buffer.readUInt16LE(26) & 16383, height: buffer.readUInt16LE(28) & 16383, format: 'webp' };
    if (chunk === 'VP8L' && buffer[20] === 47) {
      const bits = buffer.readUInt32LE(21);
      return { width: (bits & 16383) + 1, height: ((bits >>> 14) & 16383) + 1, format: 'webp' };
    }
  }
  if (buffer.length >= 4 && buffer[0] === 255 && buffer[1] === 216) {
    let cursor = 2;
    while (cursor + 4 <= buffer.length) {
      if (buffer[cursor] !== 255) break;
      while (buffer[cursor] === 255) cursor++;
      const marker = buffer[cursor++];
      if (marker === 217 || marker === 218) break;
      if (marker === 1 || marker >= 208 && marker <= 215) continue;
      if (cursor + 2 > buffer.length) break;
      const size = buffer.readUInt16BE(cursor);
      if (size < 2 || cursor + size > buffer.length) break;
      if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker) && size >= 8) {
        return { width: buffer.readUInt16BE(cursor + 5), height: buffer.readUInt16BE(cursor + 3), format: 'jpeg' };
      }
      cursor += size;
    }
  }
  return null;
}
