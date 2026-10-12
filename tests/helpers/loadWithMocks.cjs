const fs = require("node:fs");
const Module = require("node:module");
const ts = require("typescript");
const load = require("./loadTs.cjs");

module.exports = function loadWithMocks(filename, mocks) {
  const instance = new Module(filename);
  instance.filename = filename;
  instance.paths = Module._nodeModulePaths(filename);
  instance.require = (name) =>
    name in mocks
      ? mocks[name]
      : load(Module.createRequire(filename).resolve(name));
  instance._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
      fileName: filename,
    }).outputText,
    filename,
  );
  return instance.exports;
};
