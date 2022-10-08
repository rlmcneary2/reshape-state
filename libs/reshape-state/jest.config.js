module.exports = {
  preset: "../../jest.preset.js",
  transform: {
    "^.+\\.[tj]sx?$": "ts-jest"
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "html"],
  coverageDirectory: "../../coverage/libs/reshape-state",
  globals: { "ts-jest": { tsconfig: "<rootDir>/tsconfig.spec.json" } },
  displayName: "reshape-state"
};
