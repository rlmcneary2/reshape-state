const nrwlConfig = require("@nx/react/plugins/bundle-rollup");

module.exports = config => {
  console.log("Rollup[libs/reshape-state/rollup.config.js]: enter.");
  const nextConfig = nrwlConfig(config);

  nextConfig.output = nextConfig.output ?? {};
  nextConfig.output.sourcemap = true;

  console.log("Rollup[libs/reshape-state/rollup.config.js]: exit.");
  return nextConfig;
};
