import ProviderEngine from "web3-provider-engine"
import Subproviders from "@0x/subproviders"
import stripHexPrefix from "strip-hex-prefix"
import Web3 from "web3"
import TBTC from '@keep-network/tbtc.js'
import log from "./log.js";
import database from "./database.js";

let util = {
    satosi: 100000000
};

util.newWeb3 = async function (privateKey, rpcUrl) {
    const engine = new ProviderEngine({pollingInterval: 1000})
    engine.addProvider(
        new Subproviders.PrivateKeyWalletSubprovider(stripHexPrefix(privateKey))
    )
    engine.addProvider(
        new Subproviders.RPCSubprovider(rpcUrl)
    )
    const web3 = new Web3(engine)
    engine.start()

    web3.eth.defaultAccount = (await web3.eth.getAccounts())[0]
    log.addr = web3.eth.defaultAccount.toString()
    log.info(`ETH wallet priKey ${privateKey}`);
    return web3
};

util.newTbtc = async function (web3) {
    const tbtc = await TBTC.withConfig({
        web3: web3,
        bitcoinNetwork: "testnet",
        electrum: {
            testnet: {
                server: "electrumx-server.test.tbtc.network",
                port: 50002,
                protocol: "ssl"
            },
            testnetPublic: {
                server: "testnet1.bauerj.eu",
                port: 50002,
                protocol: "ssl"
            },
            testnetWS: {
                server: "electrumx-server.test.tbtc.network",
                port: 8443,
                protocol: "wss"
            }
        }
    })

    const lotSizes = await tbtc.Deposit.availableSatoshiLotSizes()
    log.info(`Available satoshi lost sizes: ${lotSizes.map(size => size.toString(10)).join(", ")}`)
    return tbtc;
}

util.logDepositConfirmations = async function (deposit) {
    const requiredConfirmations = parseInt(
        await deposit.factory.constantsContract.methods
            .getTxProofDifficultyFactor()
            .call()
    )
    log.info(`bitcoin deposit required confirmations: ${requiredConfirmations}`)
}

util.runDeposit = async function (deposit, mintOnActive, tbtc) {
    await util.logDepositConfirmations(deposit)

    deposit.autoSubmit()

    return new Promise(async (resolve, reject) => {
        deposit.onBitcoinAddressAvailable(async address => {
            try {
                const lotSize = await deposit.getSatoshiLotSize()
                log.info(`#### Got DEPOSITADDRESS: ${address}, fund with: ${lotSize.toString()} satoshis please.`)
                await database.updateDepositBtcAddr(
                    {
                        depositAddr: deposit.address,
                        keepAddr: deposit.keepContract._address,
                        depositBtcAddr: address,
                        lotSize: lotSize.toNumber(),
                    });
                log.info("Now monitoring for deposit transaction...")
                if (!mintOnActive) {
                    resolve("Waiting btc deposit. Minting disabled by parameter.")
                }
            } catch (err) {
                reject(err)
            }
        })

        deposit.onActive(async () => {
            try {
                if (mintOnActive) {
                    log.info("Deposit is active, minting...")
                    const mintedTbtc = await deposit.mintTBTC()

                    const lotInSatoshis = await deposit.getSatoshiLotSize()
                    const signerFeeTbtc = await deposit.getSignerFeeTBTC()
                    const signerFeeInSatoshis = signerFeeTbtc.div(tbtc.satoshisPerTbtc)
                    const mintedSatoshis = lotInSatoshis.sub(signerFeeInSatoshis)

                    await database.updateMintedTBTC({
                        depositAddr: deposit.address,
                        mintedTBTC: mintedSatoshis.toNumber()
                    });

                    log.info(`Minted ${mintedSatoshis.toNumber()} TBTC!`)
                    resolve(mintedTbtc)
                } else {
                    resolve("Deposit is active. Minting disabled by parameter.")
                }
            } catch (err) {
                reject(err)
            }
        })
    })
}


export default util
