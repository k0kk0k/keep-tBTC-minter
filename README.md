# keep-tBTC-minter

Automatic mint tBTC management tool, and record the status of mint through MySQL. In addition to supporting tBTC's deposit, resume, and redeem, it also supports BTC transfer. 

If you need ETH of ropsten testnet, or testnet BTC, you can submit an issue to get some.


## Setup

### Install NVM and Node 

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
nvm install v12.18.2
```

### Clone and install packages

```bash
cd ~ && git clone https://github.com/AvaLuo-code/keep-tBTC-minter.git
cd keep-tBTC-minter && npm install
```

### Init MySQL

Init MySQL with sql `sql/tbtc.sql`, you should insert some rows into `tbtc_wallet`.

```sql
INSERT INTO `tbtc_wallet` ( `address`, `priKey`, `walletType`, `lotSizeBTC`)
VALUES
	('0x7D********3030bdfA', '0x67cfa*****55f99', 'ETH', 1);
```

### Init configuration

Edit `conf.js`, set your config.

```js
let conf = {
    ethRpcUrl: "",

    // deposit
    lotSizeBTC: 1,

    // redeem
    redeemerAddress: "n4*****yyw",

    // send BTC
    blockcypherApiToken: "ef92f******1d57",
    network: "testnet", // testnet or mainnet
    wifPrivateKey: "cUP******z",
    txFee: 0.0001, // btc

    // database
    mysqlHost: "",
    mysqlPort: 3306,
    mysqlUserName: "",
    mysqlPassword: "",
    mysqlDatabase: ""
};

export default conf

```

## Usage


### Manual operation


```bash

# add to ~/.bashrc and source
alias node_exp='node --experimental-json-modules --experimental-modules' 

# deposit tBTC
node_exp index.js deposit                           # will use wallet from database
node_exp index.js deposit <eth_wallet_private_key>  # will use wallet from given private key

# resume tBTC
node_exp index.js resume                 # will pick one deposit info from database
node_exp index.js resume <deposit_addr>  # will resume given deposit which saved in database

# redeem tBTC
node_exp index.js redeem <eth_wallet_private_key> <deposit_addr> # will redeem to the redeemerAddress set in conf

# send BTC
node_exp index.js sendBtc # will send BTC from BTC_Wallet set in conf

```

### Run with Crontab

`run.sh` can help you start multiple processes at the same time.

```bash
*/10 * * * * cd ~/keep-tbtc-minter && /usr/bin/nohup /bin/bash run.sh sendBtc 1 >> log_run.log 2>&1 &
*/3 * * * * cd ~/keep-tbtc-minter && /usr/bin/nohup /bin/bash run.sh deposit 10 >> log_run.log 2>&1 &
*/3 * * * * cd ~/keep-tbtc-minter && /usr/bin/nohup /bin/bash run.sh resume 10 >> log_run.log 2>&1 &

```

## Got Problems?

We’re listening. Submit issue at https://github.com/AvaLuo-code/keep-tBTC-minter/issues.


## License

This code is published under the MIT license. See the LICENSE file in this repository for more details.
