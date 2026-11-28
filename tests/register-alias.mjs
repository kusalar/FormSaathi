import { readFileSync, statSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const srcRoot = path.resolve(process.cwd(), "src");

function isFile(p) {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

function resolveTsTarget(basePath) {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
  ];
  for (const candidate of candidates) {
    if (isFile(candidate)) {
      return pathToFileURL(candidate).href;
    }
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const target = resolveTsTarget(path.join(srcRoot, specifier.slice(2)));
      if (target) {
        return { url: target, shortCircuit: true };
      }
    }
    if (
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      context.parentURL?.startsWith("file:")
    ) {
      const parentDir = path.dirname(fileURLToPath(context.parentURL));
      const target = resolveTsTarget(path.resolve(parentDir, specifier));
      if (target) {
        return { url: target, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith(".json")) {
      const filePath = fileURLToPath(url);
      return {
        format: "module",
        shortCircuit: true,
        source: `export default ${readFileSync(filePath, "utf8")};`,
      };
    }
    if (url.endsWith(".ts") || url.endsWith(".tsx")) {
      const filePath = fileURLToPath(url);
      const raw = readFileSync(filePath, "utf8");
      const { outputText } = ts.transpileModule(raw, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
        },
      });
      return {
        format: "module",
        shortCircuit: true,
        source: outputText,
      };
    }
    return nextLoad(url, context);
  },
});
