# 🏗 Scaffold-ETH 2

<h4 align="center">
  <a href="https://docs.scaffoldeth.io">Documentation</a> |
  <a href="https://scaffoldeth.io">Website</a>
</h4>

🧪 An open-source, up-to-date toolkit for building decentralized applications (dapps) on the Ethereum blockchain. It's designed to make it easier for developers to create and deploy smart contracts and build user interfaces that interact with those contracts.

⚙️ Built using NextJS, RainbowKit, Hardhat, Wagmi, Viem, and Typescript.

- ✅ **Contract Hot Reload**: Your frontend auto-adapts to your smart contract as you edit it.
- 🪝 **[Custom hooks](https://docs.scaffoldeth.io/hooks/)**: Collection of React hooks wrapper around [wagmi](https://wagmi.sh/) to simplify interactions with smart contracts with typescript autocompletion.
- 🧱 [**Components**](https://docs.scaffoldeth.io/components/): Collection of common web3 components to quickly build your frontend.
- 🔥 **Burner Wallet & Local Faucet**: Quickly test your application with a burner wallet and local faucet.
- 🔐 **Integration with Wallet Providers**: Connect to different wallet providers and interact with the Ethereum network.

![Debug Contracts tab](https://github.com/scaffold-eth/scaffold-eth-2/assets/55535804/b237af0c-5027-4849-a5c1-2e31495cccb1)

## Requirements

Before you begin, you need to install the following tools:

- [Node (>= v20.18.3)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## Quickstart

To get started with Scaffold-ETH 2, follow the steps below:

1. Install dependencies if it was skipped in CLI:

```
cd my-dapp-example
yarn install
```

2. Run a local network in the first terminal:

```
yarn chain
```

This command starts a local Ethereum network using Hardhat. The network runs on your local machine and can be used for testing and development. You can customize the network configuration in `packages/hardhat/hardhat.config.ts`.

3. On a second terminal, deploy the test contract:

```
yarn deploy
```

This command deploys a test smart contract to the local network. The contract is located in `packages/hardhat/contracts` and can be modified to suit your needs. The `yarn deploy` command uses the deploy script located in `packages/hardhat/deploy` to deploy the contract to the network. You can also customize the deploy script.

4. On a third terminal, start your NextJS app:

```
yarn start
```

Visit your app on: `http://localhost:3000`. You can interact with your smart contract using the `Debug Contracts` page. You can tweak the app config in `packages/nextjs/scaffold.config.ts`.

Run smart contract test with `yarn hardhat:test`

- Edit your smart contracts in `packages/hardhat/contracts`
- Edit your frontend homepage at `packages/nextjs/app/page.tsx`. For guidance on [routing](https://nextjs.org/docs/app/building-your-application/routing/defining-routes) and configuring [pages/layouts](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts) checkout the Next.js documentation.
- Edit your deployment scripts in `packages/hardhat/deploy`

## 🚀 Miniapp Functionality

Miniapp extension adds functionality to easily create a Farcaster/Base MiniApp. It will take care of manifest file generation at .well-known/farcatser.json as well as generation of the metatags required for miniapp rendering in Farcaster/Base feed.

### Requirements

According to [MiniApp SDK documentation](https://miniapps.farcaster.xyz/docs/getting-started):

- Node.js 22.11.0 or higher (LTS version recommended)
- Check your version: ```node --version```
- Download from [nodejs.org](https://nodejs.org)

### Installation
- Copy packages/nextjs/.env.example to packages/nextjs/.env
- Run ngrok (or other) externally available tunnel
```typescript
ngrok http http://localhost:3000 --url https://yoursubdomian.ngrok.dev
```
- Update ```NEXT_PUBLIC_URL``` in packages/nextjs/.env for your domain
- Go to https://farcaster.xyz/~/developers/mini-apps/preview , enter your app domain and click "Open URL as Mini App"

Your miniapp should render as a MiniApp in Farcaster Preview

![MiniApp Preview](https://raw.githubusercontent.com/NikolaiL/miniapp-extension/master/images/MiniAppScreenshot.png)

For production you will need to generate the manifest accountAssociation values for your production domain and add them to the .env file (```FARCASTER_HEADER, FARCASTER_PAYLOAD, FARCASTER_SIGNATURE```). You can generate them using [Farcaster Manifest Tools](https://farcaster.xyz/~/developers/mini-apps/manifest).

### 🔗 Links

- [Farcaster MiniApp Documentation](https://miniapps.farcaster.xyz)
- [Farcaster MiniApp DevTools](https://farcaster.xyz/~/developers/)
- [Base Miniapp Preview](https://www.base.dev/preview)

## 🚀Ponder Setup

This extension also allows to use Ponder (https://ponder.sh/) for event indexing on an SE-2 dapp.

Ponder is an open-source framework for blockchain application backends. With Ponder, you can rapidly build & deploy an API that serves custom data from smart contracts on any EVM blockchain.

### Config

Ponder config (```packages/ponder/ponder.config.ts```) is set automatically from the deployed contracts and using the first blockchain network setup at ```packages/nextjs/scaffold.config.ts```.

### Design your schema

You can define your Ponder data schema on the file at ```packages/ponder/ponder.schema.ts``` following the Ponder documentation (https://ponder.sh/docs/schema).

### Indexing data

You can index events by adding files to ```packages/ponder/src/``` (https://ponder.sh/docs/indexing/write-to-the-database)

### Start the development server

Run ```yarn ponder:dev``` to start the Ponder development server, for indexing and serving the GraphQL API endpoint at http://localhost:42069

### Query the GraphQL API

With the dev server running, open http://localhost:42069 in your browser to use the GraphiQL interface. GraphiQL is a useful tool for exploring your schema and testing queries during development. (https://ponder.sh/docs/query/graphql)

You can query data on a page using ```@tanstack/react-query```. Check the code at ```packages/nextjs/app/greetings/page.ts``` to get the greetings updates data and show it.

### Deploy

To deploy the Ponder indexer please refer to the Ponder Deploy documentation https://ponder.sh/docs/production/deploy

At **Settings** -> **Deploy** -> you must set **Custom Start Command** to ```yarn ponder:start```.

And then you have to set up the ```NEXT_PUBLIC_PONDER_URL``` env variable on your SE-2 dapp to use the deployed ponder indexer.

## Documentation

Visit our [docs](https://docs.scaffoldeth.io) to learn how to start building with Scaffold-ETH 2.

To know more about its features, check out our [website](https://scaffoldeth.io).

## Contributing to Scaffold-ETH 2

We welcome contributions to Scaffold-ETH 2!

Please see [CONTRIBUTING.MD](https://github.com/scaffold-eth/scaffold-eth-2/blob/main/CONTRIBUTING.md) for more information and guidelines for contributing to Scaffold-ETH 2.