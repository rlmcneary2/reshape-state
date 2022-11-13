const nrwlConfig = require("@nrwl/react/plugins/bundle-rollup");

module.exports = config => {
  const nextConfig = nrwlConfig(config);

  nextConfig.output = nextConfig.output ?? {};
  nextConfig.output.sourcemap = true;

  return nextConfig;
};
