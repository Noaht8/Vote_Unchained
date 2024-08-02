const path = require("path");

module.exports = {
  contracts_build_directory: path.join(__dirname, "./src/contracts"),

  networks: {
    development: {
      network_id: "*",
      host: "127.0.0.1",
      port: 8545, // for ganache-cli
      gas: 6721975,
      gasPrice: 20000000000,
    },
  },

  compilers: {
    solc: {
      version: "0.8.4", // Version of solc you want to use
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
};
