import bitcoin from "bitcoinjs-lib";
import blockcypher from "blockcypher";
import fetch from "node-fetch";
import conf from '../conf.js'
import log from "../lib/log.js";
import database from "../lib/database.js";
import util from "../lib/util.js";

const networkTypes = {testnet: "testnet", mainnet: "mainnet"};

async function send(param) {
    if (param.toAddress.length === 0) {
        log.info("Send to address list is empty.")
        return
    }
    let bcapi;
    let utxoApiUrlPre;
    let network = bitcoin.networks.testnet;
    if (param.network === networkTypes.testnet) {
        bcapi = new blockcypher('btc', 'test3', param.blockcypherApiToken);
        utxoApiUrlPre = "https://api.blockcypher.com/v1/btc/test3/addrs"
    } else if (param.network === networkTypes.mainnet) {
        bcapi = new blockcypher('btc', 'main', param.blockcypherApiToken);
        network = bitcoin.networks.bitcoin;
        utxoApiUrlPre = "https://api.blockcypher.com/v1/btc/main/addrs"
    }

    let keyPair = bitcoin.ECPair.fromWIF(param.wifPrivateKey, network);
    const account = bitcoin.payments.p2pkh({pubkey: keyPair.publicKey, network: network})
    let fromAddr = account.address;

    let totalNeedAmt = param.toAddress.reduce((a, b) => a + b.value * util.satosi, param.txFee * util.satosi);
    log.info(`From ${fromAddr} need ${totalNeedAmt / util.satosi}BTC`);

    const allUnspents = await getUnspentsFromApi(fromAddr,
        `${utxoApiUrlPre}/${fromAddr}?unspentOnly=true&confirmations=1`);
    const [targetUnspents, sum] = filterUnspentsByAmount(
        allUnspents,
        totalNeedAmt,
    );

    if (targetUnspents.length <= 0) {
        throw new Error(`${fromAddr} has no enough unspents`);
    }

    let txb = new bitcoin.TransactionBuilder(network);
    txb.setVersion(1);
    for (let unspent of targetUnspents) {
        txb.addInput(unspent.txid, unspent.vout);
    }
    param.toAddress.forEach(to => txb.addOutput(to.address, to.value * util.satosi));
    const change = sum - totalNeedAmt;
    if (change > 0) {
        txb.addOutput(fromAddr, change);
    }

    for (let i = 0; i < txb.__INPUTS.length; i++) {
        txb.sign(i, keyPair);
    }

    let rawTransaction = txb.build().toHex();
    return new Promise(async (resolve, reject) => {
        bcapi.pushTX(rawTransaction, function (err, body) {
            if (err) {
                reject(err)
            } else {
                let txHash = body.tx.hash
                log.info(`Broadcast tx ${txHash}\n ${JSON.stringify(body)}`);
                resolve(txHash)
            }
        })
    })
}

async function getUnspentsFromApi(address, url) {
    const res = await fetch(url);
    const response = await res.json();
    if (response.error) {
        log.error(`blockcypher api error: ${response.error}`);
        throw new Error(response.error);
    }
    return (response.txrefs || []).map(utxo => ({
        txid: utxo.tx_hash,
        vout: utxo.tx_output_n,
        amount: utxo.value
    }));
}

function filterUnspentsByAmount(unspents, amount) {
    const nonZeroUnspents = unspents.filter(utxo => utxo.amount > 0);
    const result = [];
    let sum = 0;
    for (let utxo of nonZeroUnspents) {
        result.push(utxo);
        sum += utxo.amount;
        if (sum > amount) {
            break;
        }
    }
    return [sum < amount ? [] : result, sum];
}

async function sendBtc() {
    let dbRows = await database.getToSendBTCDeposits();
    if (dbRows.length === 0) {
        return "Can not find deposits need to sendBtc"
    } else {
        log.info(`Got to send btc deposits: ${JSON.stringify(dbRows)}`)
    }

    let sendParameters = {
        blockcypherApiToken: conf.blockcypherApiToken,
        network: conf.network,
        wifPrivateKey: conf.wifPrivateKey,
        txFee: conf.txFee,
        toAddress: [],
    }

    for (let i = 0; i < dbRows.length; i++) {
        let row = dbRows[i];
        log.info(`DepositAddr ${row.depositAddr} send ${row.lotSize} to ${row.depositBtcAddr}`)
        sendParameters.toAddress.push({
            address: row.depositBtcAddr,
            value: row.lotSize / util.satosi
        })
    }

    let txHash = await send(sendParameters);
    log.info(`Got result ${txHash}`)
    await database.updateSendBTCTxHash(dbRows, txHash)
}

export default sendBtc
