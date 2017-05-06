module.exports = function(storybookBaseConfig, configType) {
  storybookBaseConfig.resolve.extensions.unshift('.es6')
  storybookBaseConfig.module.loaders.push({
    test: /\.es6$/,
    exclude: /node_modules/,
    loader: 'babel',
  })

  return storybookBaseConfig;
}
