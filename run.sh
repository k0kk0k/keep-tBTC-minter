#! /bin/bash

# `run.sh` can help you start multiple processes at the same time, you can use crontab

# */10 * * * * cd ~/keep-tbtc-minter && /usr/bin/nohup /bin/bash run.sh sendBtc 1 >> log_run.log 2>&1 &
# */3 * * * * cd ~/keep-tbtc-minter && /usr/bin/nohup /bin/bash run.sh deposit 10 >> log_run.log 2>&1 &
# */3 * * * * cd ~/keep-tbtc-minter && /usr/bin/nohup /bin/bash run.sh resume 10 >> log_run.log 2>&1 &

node_exp="/home/ubuntu/.nvm/versions/node/v12.18.2/bin/node --experimental-json-modules --experimental-modules"

action=$1
threadNum=$2
echo "================$(date) Action $action with $threadNum thread"
ps -ef | grep "index.js ${action}" | grep -v grep | awk '{print $2}' | xargs kill -9

for ((i=0; i<$threadNum; ++i)); do
    echo "$(date) ===Start $action #$i===="
    /usr/bin/nohup $node_exp index.js $action >> log_$action.log 2>&1 &
done
