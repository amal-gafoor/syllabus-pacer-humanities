/**
 * ESM resolve hook that teaches plain `node` two things the bundler does for
 * free: the `@/…` alias from jsconfig.json, and extensionless imports such as
 * `./plus-one-hum`. Lets the planner modules run outside Next — see
 * scripts/check-planner.mjs.
 */

import { existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const isFile = (p) => existsSync(p) && statSync(p).isFile();

/** Mirror the bundler's guessing: bare → .js → .jsx → /index.js. */
const withExtension = (base) =>
  [base, `${base}.js`, `${base}.jsx`, join(base, "index.js"), join(base, "index.jsx")].find(isFile);

export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    const target = withExtension(join(ROOT, specifier.slice(2)));
    if (!target) throw new Error(`Cannot resolve alias "${specifier}"`);
    return next(pathToFileURL(target).href, context);
  }

  if (specifier.startsWith(".") && context.parentURL) {
    const base = join(dirname(fileURLToPath(context.parentURL)), specifier);
    const target = withExtension(base);
    if (target) return next(pathToFileURL(target).href, context);
  }

  return next(specifier, context);
}
