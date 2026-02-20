export const STB = {
  chainId: "stbchain-local",
  chainName: "STB Localnet",
  rpc: "http://localhost:26657",
  rest: "http://localhost:1317",
  rpcWeb: "/rpc",
  restWeb: "/lcd",
  issuer: "cosmos1vkx3ndvn8sqyamnn25cc2h3ge00mna8r3wmy64",
  testRecipient: "cosmos1qen9wdn4t03uprrzw7y6ckftczgu8w5tysz3ge",
  stakeCurrency: {
    coinDenom: "STB",
    coinMinimalDenom: "ustb",
    coinDecimals: 6,
  },

  bip44: { coinType: 118 },

  // Судя по адресам в прошлых логах — префикс "cosmos"
  bech32Config: {
    bech32PrefixAccAddr: "cosmos",
    bech32PrefixAccPub: "cosmospub",
    bech32PrefixValAddr: "cosmosvaloper",
    bech32PrefixValPub: "cosmosvaloperpub",
    bech32PrefixConsAddr: "cosmosvalcons",
    bech32PrefixConsPub: "cosmosvalconspub",
  },
};