export default ({ config }) => ({
  ...config,
  plugins: [...(config.plugins || []), './plugins/with-api-network.cjs'],
});
