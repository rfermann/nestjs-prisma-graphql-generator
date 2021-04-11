module.exports = () => {
  return {
    autoDetect: true,
    // files: ["!/**/fixtures/*.js"],
    testFramework: {
      configFile: "./jest.config.wallaby.js",
    },
  };
};
