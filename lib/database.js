import mysql from 'mysql2'
import conf from '../conf.js'
import log from "./log.js";

const pool = mysql.createPool({
    host: conf.mysqlHost,
    port: conf.mysqlPort,
    user: conf.mysqlUserName,
    password: conf.mysqlPassword,
    database: conf.mysqlDatabase
});

const promisePool = pool.promise();
let database = {};

async function querySql(sql, params) {
    return await promisePool.query(sql, [params])
        .then(([rows, fields]) => {
            return [rows, fields];
        })
        .catch((error) => {
            log.error(`database error: sql: ${sql}, error: ${error}`);
            process.exit(-1);
        });
}

database.insertDepositInfo = async function (d) {
    log.info(`Insert into db for deposit ${d.depositAddr}`);
    let sql = `INSERT INTO tbtc_deposit (
                    ethWalletAddr,
                    ethWalletPri,
                    depositAddr,
                    keepAddr,
                    lotSize) 
                    VALUES ( 
                        '${d.ethWalletAddr}', 
                        '${d.ethWalletPri}', 
                        '${d.depositAddr}', 
                        '${d.keepAddr}', 
                        ${d.lotSize});`;

    return await querySql(sql, []);
};

database.updateDepositBtcAddr = async function (d) {
    let sql = `UPDATE tbtc_deposit 
              SET depositBtcAddr='${d.depositBtcAddr}', keepAddr='${d.keepAddr}', lotSize=${d.lotSize}
               WHERE depositAddr='${d.depositAddr}' AND depositBtcAddr ="";`;
    return await querySql(sql, []);
};

database.updateMintedTBTC = async function (d) {
    let sql = `UPDATE tbtc_deposit
               SET mintedTBTC=${d.mintedTBTC}
               WHERE depositAddr='${d.depositAddr}' AND mintedTBTC=0;`;
    return await querySql(sql, []);
};

database.updateLastResumedAt = async function (id) {
    let sql = `UPDATE tbtc_deposit
               SET lastResumedAt=NOW()
               WHERE id=${id};`;
    return await querySql(sql, []);
};

database.getToSendBTCDeposits = async function () {
    const [rows, fields] = await querySql(
            `SELECT id,depositAddr,depositBtcAddr,lotSize
                FROM tbtc_deposit 
                WHERE depositBtcTx ="" AND depositBtcAddr != "";`,
        []);
    return rows;
};

database.updateSendBTCTxHash = async function (rows, txHash) {
    let idArr = rows.map(row => row.id);
    let sql = `UPDATE tbtc_deposit
               SET depositBtcTx='${txHash}', depositBtcTs=NOW()
               WHERE id IN (${idArr});`;
    return await querySql(sql, []);
};

database.getDepositInfoByDepositAddr = async function (depositAddr) {
    const [rows, fields] = await querySql(
        `SELECT id,ethWalletPri,depositAddr,depositBtcTx 
            FROM tbtc_deposit 
            WHERE depositAddr='${depositAddr}' AND mintedTBTC=0;`,
        []);
    if (rows.length > 0) {
        return rows[0]
    } else {
        return undefined
    }
};

database.pickOneToResumeDeposit = async function () {
    const [rows, fields] = await querySql(
            `SELECT id, ethWalletPri,depositAddr,depositBtcTx 
                 FROM tbtc_deposit 
                 WHERE mintedTBTC=0
                 ORDER BY updatedAt
                 LIMIT 1;`,
        []);

    if (rows.length > 0) {
        return rows[0]
    } else {
        return undefined
    }
};

database.pickOneWallet = async function (type) {
    const [rows, fields] = await querySql(
        `SELECT id, address, priKey, lotSizeBTC 
             FROM tbtc_wallet 
             WHERE walletType='${type}'
             ORDER BY updatedAt
             LIMIT 1;`,
        []);

    if (rows.length > 0) {
        return rows[0]
    } else {
        return undefined
    }
};

database.updateWalletLastUsedAt = async function (id) {
    let sql = `UPDATE tbtc_wallet
               SET lastUsedAt=NOW()
               WHERE id=${id};`;
    return await querySql(sql, []);
};

export default database;
