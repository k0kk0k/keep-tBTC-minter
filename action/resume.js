import util from '../lib/util.js'
import conf from '../conf.js'
import log from "../lib/log.js";
import database from "../lib/database.js";

async function resumeDeposit(row) {
    const web3 = await util.newWeb3(row.ethWalletPri, conf.ethRpcUrl)
    const tbtc = await util.newTbtc(web3)

    const deposit = await tbtc.Deposit.withAddress(row.depositAddr)
    log.info(`depositAddr: ${deposit.address}`)
    log.info(`keepAddr: ${deposit.keepContract._address}`)

    let mintOnActive = false
    if (row.depositBtcTx) {
        log.info("mine TBTC!!!")
        mintOnActive = true
    }

    try {
        await util.runDeposit(deposit, mintOnActive, tbtc)
    } catch (e) {
        log.error(`runDeposit error ${e}`)
    }
}

async function resume(inputArg) {
    let row
    if (inputArg) {
        row = await database.getDepositInfoByDepositAddr(inputArg)
    } else {
        row = await database.pickOneToResumeDeposit()
    }

    if (row === undefined) {
        log.info(`Can not find depositAddr with input ${inputArg}`)
    } else {
        log.info(`Got deposit info ${JSON.stringify(row)}`)
        await database.updateLastResumedAt(row.id)
        await resumeDeposit(row)
    }
}

export default resume
