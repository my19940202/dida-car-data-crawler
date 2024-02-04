/**
    定时任务请求嘀嗒评车API，然后本地保存格式化数据，用于地图可视化分析
*/
const schedule = require('node-schedule');
const {carListFetch} = require('./util');

async function main() {
    try {
        // 每5min执行一次
        const job = schedule.scheduleJob('*/3 * * * *', async function() {
            console.log(new Date().toLocaleString() + ' running');
            // 获取上班数据
            await carListFetch('WORK');

            // 获取下班数据
            await carListFetch('HOME');

            // 获取附近数据(江月路)
            await carListFetch('NEAR');
        });
    }
    catch (error) {
        console.log('error', error);
    }
};
main();

process.on('SIGINT', function (err) {
    console.log('err', err);

    schedule.gracefulShutdown()
    .then(() => process.exit(0))
})