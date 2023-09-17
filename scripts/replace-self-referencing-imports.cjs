"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const path = require("path");
const distDir = path.resolve(__dirname, "..", "dist").replace(/\\/g, "/");
const distSrcDir = path.join(distDir, "package").replace(/\\/g, "/");
function replaceSelfReferencingImports({ orig, file, config }) {
  if (!file.replace(/\\/g, "/").startsWith(distDir)) return orig;
  return orig.replace(/['"]([^"'\r\n]+)['"]/, (match, importPath) => {
    console.log(`Checking ${importPath}`,importPath.startsWith("@idealeap/pipeline"),file.replace(/\\/g, "/").startsWith(distSrcDir));
    if (!importPath.startsWith("@idealeap/pipeline")) return match;
    if (!file.replace(/\\/g, "/").startsWith(distSrcDir)) return match;
    let relativePath = path.relative(
      path.dirname(file),
      path.join(distSrcDir, importPath.substring("@idealeap/pipeline".length)),
    );
    if (!relativePath.startsWith(".")) relativePath = `./${relativePath}`;
    console.log(`Replacing ${importPath} with ${relativePath}`);
    return JSON.stringify(relativePath);
  });
}
exports.default = replaceSelfReferencingImports;
