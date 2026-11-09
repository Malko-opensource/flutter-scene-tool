import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { ToolError } from './errors.mjs';

export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export const json = value => `${JSON.stringify(value, null, 2)}\n`;
export function readJson(filename) {
  const absolute = path.resolve(filename);
  let current = path.parse(absolute).root;
  for (const part of absolute.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    if (fs.lstatSync(current).isSymbolicLink()) throw new ToolError('SYMLINK_PATH', 'JSON inputs and their parent directories cannot be symlinks');
  }
  const stat = fs.statSync(filename);
  if (!stat.isFile() || stat.size > 2 * 1024 * 1024) throw new ToolError('INPUT_SIZE', 'JSON input must be a file no larger than 2 MiB');
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(fs.readFileSync(filename))); }
  catch { throw new ToolError('INVALID_JSON', `Invalid JSON: ${path.basename(filename)}`); }
}

export function safePath(root, relative) {
  if (typeof relative !== 'string' || !relative || relative.includes('\\') || path.isAbsolute(relative) || relative.split('/').some(p => p === '..' || p === '.' || !p)) {
    throw new ToolError('UNSAFE_PATH', 'Paths must be normalized, relative, and contained in the project');
  }
  const resolvedRoot = fs.realpathSync(root);
  const target = path.resolve(resolvedRoot, relative);
  if (!target.startsWith(`${resolvedRoot}${path.sep}`)) throw new ToolError('UNSAFE_PATH', 'Path escaped the project');
  let current = resolvedRoot;
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    try {
      if (fs.lstatSync(current).isSymbolicLink()) throw new ToolError('SYMLINK_PATH', 'Symlinks are not accepted for scene inputs or generated outputs');
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return target;
}

export function writeAtomic(filename, content) {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const tmp = `${filename}.${randomBytes(6).toString('hex')}.tmp`;
  try { fs.writeFileSync(tmp, content, { flag: 'wx' }); fs.renameSync(tmp, filename); }
  finally { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); }
}

export function withLock(root, action) {
  const lock = safePath(root, '.scene-tool/write.lock');
  fs.mkdirSync(path.dirname(lock), { recursive: true });
  let fd;
  try { fd = fs.openSync(lock, 'wx'); }
  catch (error) {
    if (error.code === 'EEXIST') throw new ToolError('LOCKED', 'Another writer or a stale lock exists. Confirm no writer is active before removing .scene-tool/write.lock');
    throw error;
  }
  try { fs.writeFileSync(fd, json({ pid: process.pid })); return action(); }
  finally { fs.closeSync(fd); fs.unlinkSync(lock); }
}
