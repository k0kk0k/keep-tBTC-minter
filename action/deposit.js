import BN from 'bn.js'
import util from '../lib/util.js'
import conf from '../conf.js'
import log from "../lib/log.js";
import database from "../lib/database.js";

async function deposit(inputArg) {
    let priKey
    let lotSizeBTC = conf.lotSizeBTC
    if (inputArg) {
        priKey = inputArg
    } else {
        let row = await database.pickOneWallet("ETH")
        if (row === undefined) {
            log.info(`Can not find wallet with input ${inputArg}`)
            return
        } else {
            log.info(`Got wallet ${JSON.stringify(row)}`)
            priKey = row.priKey
            lotSizeBTC = row.lotSizeBTC
            await database.updateWalletLastUsedAt(row.id)
        }
    }

    const web3 = await util.newWeb3(priKey, conf.ethRpcUrl)
    const tbtc = await util.newTbtc(web3)
    const lotSize = new BN(util.satosi * lotSizeBTC)
    log.info(`Initiating deposit ${lotSize.toNumber()}...`)
    const deposit = await tbtc.Deposit.withSatoshiLotSize(lotSize)
    log.info(`$$$$$$!!!!!! Success init deposit ${deposit.address}`)
    await database.insertDepositInfo({
        ethWalletAddr: web3.eth.defaultAccount.toString(),
        ethWalletPri: priKey,
        depositAddr: deposit.address,
        keepAddr: deposit.keepContract._address,
        lotSize: lotSize.toNumber()
    });

    await util.runDeposit(deposit, false, tbtc)
}

export default deposit
