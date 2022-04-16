# Bridge

* BSC Testnet [0xE1581C9ac876893A203283085390B0D6921d9664](https://testnet.bscscan.com/address/0xE1581C9ac876893A203283085390B0D6921d9664)
* Rinkeby [0x70D74aa7d471E3131680A159F728197dc2893192](https://rinkeby.etherscan.io/address/0x70D74aa7d471E3131680A159F728197dc2893192)

### Coverage

| Contract | % Stmts | % Branch | % Funcs | % Lines |
|----------|---------|----------|---------|---------|
| Bridge   | 100     | 100      | 100     | 100     |

### Deploy

```shell
VALIDATOR=ADDRESS npx hardhat run scripts/deploy.ts
```

### Verification

```shell
npx hardhat verify TOKEN_ADDRESS VALIDATOR_ADDRESS
```

### Custom tasks

```shell
npx hardhat sign
```

#### Examples

```shell
npx hardhat sign --from 0xb08A6d31689F15444f9F3060Ef6bB63E66Be76D2 --to 0xb08A6d31689F15444f9F3060Ef6bB63E66Be76D2 --amount 500000000000000000000000000000000000000000000000000000000000 --nfrom 97 --nto 4 --nonce 1 --network rinkeby
```