let ShareVoting = artifacts.require("./ShareVoting.sol");

module.exports = function (deployer) {
  deployer.deploy(ShareVoting);
};
