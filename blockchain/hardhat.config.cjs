require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  throw new Error("الرجاء وضع PRIVATE_KEY في ملف .env");
}

module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {},


    localhost:{
      url:"http://127.0.0.1:8545",
       chainId: 1337,   // أضف هذا السطر فقط
    },

    sepolia: {
      url: "https://rpc.sepolia.org",
      accounts: [PRIVATE_KEY],
    },
  },
};