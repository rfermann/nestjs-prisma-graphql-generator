module.exports = {
  ...require("tsdx/dist/createJestConfig").createJestConfig(".", __dirname),
  coveragePathIgnorePatterns: ["src/generate.ts", "src/index.ts", "src/types.d.ts"],
};
