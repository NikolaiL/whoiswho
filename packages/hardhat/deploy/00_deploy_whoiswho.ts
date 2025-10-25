import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys a contract named "WhoIsWho" using the deployer account
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployWhoIsWho: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` or `yarn account:import` to import your
    existing PK which will fill DEPLOYER_PRIVATE_KEY_ENCRYPTED in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const initialMintPrice = 0; // Free minting by default

  await deploy("WhoIsWho", {
    from: deployer,
    // Contract constructor arguments: owner address and initial mint price
    args: [deployer, initialMintPrice],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const whoIsWho = await hre.ethers.getContract<Contract>("WhoIsWho", deployer);
  console.log("📸 WhoIsWho NFT contract deployed!");
  console.log("💰 Mint Price:", await whoIsWho.mintPrice(), "wei");
  console.log("🎫 Next Token ID:", await whoIsWho.getCurrentTokenId());
};

export default deployWhoIsWho;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags WhoIsWho
deployWhoIsWho.tags = ["WhoIsWho"];
