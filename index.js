#!/usr/bin/env node --experimental-json-modules --experimental-modules

import deposit from "./action/deposit.js";
import resume from "./action/resume.js";
import redeem from "./action/redeem.js";
import sendBtc from "./action/sendBtc.js";
import log from "./lib/log.js";

let args = process.argv.slice(2)
if (process.argv[0].includes("run.js")) {
    args = process.argv.slice(1) // invoked directly, no node
}

let action = null

switch (args[0]) {
    case "deposit":
        action = async () => {
            return await deposit(args[1])
        }
        break
    case "resume":
        action = async () => {
            return await resume(args[1])
        }
        break
    case "redeem":
        action = async () => {
            return await redeem(args[1], args[2])
        }
        break
    case "sendBtc":
        action = async () => {
            return await sendBtc()
        }
        break
}

if (!action) {
    log.error("only support arg deposit/resume/redeem/sendBtc")
    process.exit(1)
}

async function runAction() {
    return action()
}

runAction()
    .then(result => {
        log.info(`Action completed with final result: ${result}`)
        process.exit(0)
    })
    .catch(error => {
        log.error(`Action errored out with error: ${JSON.stringify(error)}`)
        process.exit(1)
    })

