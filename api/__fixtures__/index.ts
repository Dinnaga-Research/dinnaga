// ABOUTME: Loads the recorded API fixtures for the api/ tests. The files are the real GitHub and
// ABOUTME: Substack responses of 2026-11-13, trimmed to the fields the function reads; no token in any.
import { readFileSync } from 'node:fs';

const read = (name: string) => readFileSync(new URL(name, import.meta.url), 'utf8');

/** A recorded JSON body, parsed. */
export const fixtureJson = (name: string): unknown => JSON.parse(read(name));

/** A recorded body, raw (the Substack feed). */
export const fixtureText = read;

/** The instant the fixtures were recorded; tests pin the clock here so the 183-day window is stable. */
export const RECORDED_AT = new Date('2026-11-13T12:00:00Z');
