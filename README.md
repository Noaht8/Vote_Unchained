# Vote_Unchained

# Blockchain-based Voting System

## Overview
This project is a decentralized, secure, and transparent voting system built on the Ethereum blockchain. It leverages smart contracts written in Solidity, managed by the Truffle framework, and deployed locally using Ganache. The frontend is built with React, providing a user-friendly interface for voters. IPFS (InterPlanetary File System) is integrated for decentralized data storage and retrieval.

## Features
- **Decentralized Voting**: Votes are recorded on the blockchain to ensure immutability and transparency.
- **Smart Contract Security**: Solidity smart contracts manage the voting logic and ensure tamper-proof election processes.
- **IPFS Storage**: Proposal metadata and related documents are stored on IPFS for decentralized and secure access.
- **User Interface**: A responsive React frontend allows voters to interact with the voting system seamlessly.
- **Local Blockchain**: Ganache is used as a local Ethereum blockchain for testing purposes.

## Tech Stack
- **Solidity**: Smart contract development
- **Truffle**: Ethereum development framework
- **Ganache**: Local blockchain for development and testing
- **IPFS**: Decentralized file storage
- **React**: Frontend framework
- **Web3.js / Ethers.js**: Blockchain interaction

## Prerequisites
Before running this project, ensure you have the following installed:
- [Truffle](https://trufflesuite.com/truffle)
- [Ganache](https://trufflesuite.com/ganache)
- [IPFS](https://ipfs.io/) (Optional: for local IPFS node)
- [MetaMask](https://metamask.io/) (for browser wallet integration)

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/Noaht8/Vote_Unchained.git
cd src
```

### 2. Install Dependencies
Install the dependencies for both the backend and the frontend:
#### Backend (Truffle), Frontend (React)
```
npm install
```

### 3. Set Up Local Blockchain
Open Ganache and create a new workspace.
Update truffle-config.js with the correct Ganache settings (localhost with port 8545).
Deploy the smart contracts to your local blockchain
```
truffle migrate
```

### 4. Run the IPFS Node
If you want to run a local IPFS node, start IPFS:
```
ipfs init
ipfs daemon
```

### 5. Start the React Frontend
```
npm start
```

### 6. Open the Application
Navigate to `http://localhost:3000` in your browser to interact with the voting system.

### Project Structure
```
blockchain-voting-system/
│
├── contracts/           # Solidity smart contracts
│   └── ShareVoting.sol       # Core voting contract
│
├── migrations/          # Deployment scripts for Truffle
│
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   ├── contracts    # Contracts after compilation
│   │   └── App.jsx      # Main app component
│   └── public/          # Public assets
│
├── test/                # Unit tests for smart contracts
│
└── truffle-config.js    # Truffle project configuration
```


### License
This project is licensed under the `MIT License`. See the LICENSE file for more information.
```
This template covers the necessary instructions for setting up and running the blockchain-based voting system, while also highlighting the important features and tools used in the project.
```
