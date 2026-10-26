// ABOUTME: Operator CLI: converts one or two PNG frames into the generated Cromulon frame data module.
// ABOUTME: Run via `bun run cromulon:convert`; refuses tracked files and anything under src/ or public/.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { PNG } from 'pngjs';
import { convertPng, croppedSize, emitModule, preview, type Crop } from './cromulon-lib';

const ROOT = resolve(import.meta.dirname, '..');
const DEFAULT_OUT = resolve(ROOT, 'src/components/cromulon/cromulon-frame.ts');

function fail(msg: string): never {
  process.stderr.write(`cromulon:convert: ${msg}\n`);
  process.exit(1);
}

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === '--') continue;
    if (!a.startsWith('--')) fail(`unexpected argument ${a}`);
    const v = argv[++i];
    if (v === undefined) fail(`${a} needs a value`);
    out[a.slice(2)] = v;
  }
  return out;
}

/** Throws a message when the input may not be read: under src/ or public/, or tracked by git. */
function guardInput(path: string): string {
  const abs = resolve(ROOT, path);
  const rel = relative(ROOT, abs);
  const top = rel.split(sep)[0];
  if (top === 'src' || top === 'public') fail(`refusing ${path}: source images must not live under src/ or public/`);
  const tracked = spawnSync('git', ['ls-files', '--error-unmatch', '--', abs], { cwd: ROOT, stdio: 'ignore' });
  if (tracked.status === 0) fail(`refusing ${path}: it is tracked by git; keep source images in the git-ignored cromulon-src/`);
  return abs;
}

function num(v: string | undefined, name: string): number | undefined {
  if (v === undefined) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) fail(`${name} must be a number`);
  return n;
}

const args = parseArgs(process.argv.slice(2));
if (!args.open) {
  fail('usage: bun run cromulon:convert -- --open cromulon-src/frame.png [--closed cromulon-src/frame-closed.png] [--crop x,y,w,h] [--black 0..1] [--white 0..1] [--width 160]');
}
const openPath = guardInput(args.open);
const closedPath = args.closed ? guardInput(args.closed) : undefined;

let crop: Crop | undefined;
if (args.crop) {
  const p = args.crop.split(',').map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n))) fail('--crop must be x,y,w,h in whole pixels');
  crop = { x: p[0]!, y: p[1]!, w: p[2]!, h: p[3]! };
}
const width = num(args.width, '--width') ?? 160;
if (!Number.isInteger(width) || width < 1) fail('--width must be a positive integer');
const opts = { crop, black: num(args.black, '--black'), white: num(args.white, '--white'), width };

function load(path: string): PNG {
  try {
    return PNG.sync.read(readFileSync(path));
  } catch (e) {
    return fail(`cannot read ${path} as a PNG (convert JPEGs first, e.g. sips -s format png in.jpg --out frame.png): ${(e as Error).message}`);
  }
}

const openPng = load(openPath);
const closedPng = closedPath ? load(closedPath) : undefined;
if (closedPng) {
  const a = croppedSize(openPng, crop);
  const b = croppedSize(closedPng, crop);
  if (a.w !== b.w || a.h !== b.h) fail(`open is ${a.w}x${a.h} but closed is ${b.w}x${b.h} after cropping; they must match`);
}
try {
  const open = convertPng(openPng, opts);
  const closed = closedPng ? convertPng(closedPng, opts) : undefined;
  const out = args.out ? resolve(args.out) : DEFAULT_OUT;
  writeFileSync(out, emitModule(open.width, open.height, open.levels, closed?.levels));
  process.stdout.write(`open (${open.width}x${open.height}):\n${preview(open.levels, open.width, open.height)}\n`);
  if (closed) process.stdout.write(`closed:\n${preview(closed.levels, closed.width, closed.height)}\n`);
  process.stdout.write(`wrote ${out}\n`);
} catch (e) {
  fail((e as Error).message);
}
