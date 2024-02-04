/**
    工具函数
*/

const _ = require('lodash');
const fs = require('fs');
const axios = require('axios');

const dataFormatHelper = (item) => {
    const {
        // 起点和终点
        from_poi, to_poi,
        // 订单时间
        plan_start_time, create_time,
        available_start_time_from,
        available_start_time_to,
        // 乘客信息
        passenger_user_info,
        // 费用信息
        suggest_price, driver_received_price, thanks_price
    } = item || {};

    return {
        from_poi, to_poi, plan_start_time, create_time,
        suggest_price, driver_received_price, thanks_price,
        available_start_time_from,
        available_start_time_to,
        passenger_user_info
    };
};

// 判断文件是否包含某个字符串
async function containCertainStr(filePath, searchString) {  
    try {
        const data = await fs.promises.readFile(filePath, 'utf8');
        return data.includes(searchString);
    } catch (err) {
        return false;
    }
}

async function appendContent(filePath, data) {
    // 提取一些重点信息用于后续excel分析
    const cid = _.get(data, 'passenger_user_info.cid', '');
    const formatedContent = [
        cid,
        data.create_time,
        _.get(data, 'passenger_user_info.name', ''),
        _.get(data, 'passenger_user_info.gender', ''),
        _.get(data, 'from_poi.short_address', ''),
        _.get(data, 'from_poi.longitude', ''),
        _.get(data, 'from_poi.latitude', ''),
        _.get(data, 'to_poi.short_address', ''),
        _.get(data, 'to_poi.longitude', ''),
        _.get(data, 'to_poi.latitude', ''),
        (data.driver_received_price || 0) + (data.thanks_price || 0),
        JSON.stringify(data)
    ];
    await fs.promises.appendFile(filePath, '\n' + formatedContent.join('\t'), (err) => {
        if (err) {
            console.log(`append err`);
            throw err;
        }
        else {
            console.log(`${filePath} ${cid} append done`);
        }
    });
}

function objectToQueryString(obj) {  
    return Object.keys(obj).map(key =>
        `${key}=${obj[key]}`
    ).join('&');
}

// 订单默query
const def_query = {
    day_filter: 2,
    eco_route_type: 0,
    order_by: 'auto',
    page: 1,
    page_size: 20,
    ride_type: 1,
    search_type: 0,
    user_cid: 'cca525a1-ff00-4a4e-a0bd-44c9ea244405'
};

// 请求headers包含鉴权和cookie等信息
const HEADERS_MAP = {
    WORK: {
        'Host': 'capis-2.didapinche.com', 
        'Cookie': '__clickidc=155075955653883511; acw_tc=e44ea45d16c70c5fe6f70e12cbafe337e08be4f0b08d7711c0f7783d35a51b4a', 
        'ddcinfo': 'xMBPaen8FeTm6vYl5KB4SkwR6MopzTW6B4xftQZiR00hZ7pBeP3pFtJnUFr2+Yt546TiWLrDjuUFEpcT/5v5cvoxitP+lkdiH4OFxnVCnKzS/6ITtib9C9qAehvzs015KdqCcxmFCSI0kfBLAbvkD77I3foT4v3EWiAbqQ/mPL3RKqFHcZLnGVkw2YifTurcHc8N9k7T7HY+VpdD94ZZNfomf31Qr7Txyvd3w/iQmTMCNZRtiGLrksOeLET5ESgK/xylncdN//mDgqUjP2LTO7CTp+wk3oR0aL6Q1e7rYIccKSWDRiTu/gqFoW9Yao1gCOmnzl04lXJ6fPYaISWmnredQhBLNr8Y+RsSSdUal/jOiWT2BOJnEmoI1RTamGWeyt9OlUuj3VBbS/OPCBAesjaLqBf73TsgKPROhqBAyHCxTCrG9pXYtebcidc/UdEGw77lG/XEtOWeQStVY5bca1MJmwu8oIlAm2jqlZR/l0f5nfCmcnHu8LuyRZxU7KUPHrnML1dqsevrTR3TLlVGpI08NKjj1GPpB+LguPsugA2seilYtyNuBaJ7g4VmO7fka0bVCykS5dtxym0dDhwhw4aYKagBAUlbSNLTZgI6wg6mIsTin4vFZUdp5qGO5sKfLdru+kFuWp/53NbSIDH0grAJpNqYNVot3m3e74V6kljNj/JKvtCeqP75u4/7OFExKrlrq14AdYlWsLDJLUwfc+IDAGfdER2b3QoJruVp2zJMYUN5AHBmQO/VOnsNHTwRmQgObAWmvDpQCa0EkazGnpMPZLGlfP8mk90oUTqSQn5duxjP66JhZEyROZyu/umQRXQNHeR0VfGX3lO98LlAeNvXqfLWmlhydMHnCnJkI/wZ46rkFopFV2ELzYz7blGbHXe2bCyy1VbFtMJbIDMAu2nLsvLj6TKCmvr2NdvBD4hnfGjNwIgKCbOWgc7zElQZ8J4fy5c/MW74wumJcPqccVBE6frAXO29aTe2oCGkoGnT2ftyhrmec8QlurPK+MWr', 
        'accept-language': 'en-FR;q=1, zh-Hans-FR;q=0.9, zh-Hant-FR;q=0.8, fr-FR;q=0.7', 
        'authorization': 'Bearer DadQysahmfxzlREoUypF54LHduBOhvq/8gqsEUNIIAai7kDtghhfvrRvjCFIWu+IaTg5QFhDQz6Vw2y+Xb/McmGLRRY6agvCu6r0N+7asLBvMt80jcsYVCYoOpK2Df3S', 
        'sign': 'd82cd325fdf1ec69d90592242a66f65b 1706452902 carpool'
    },
    HOME: {
        'Host': 'capis-2.didapinche.com', 
        'Cookie': '__clickidc=155075955653883511; acw_tc=e44ea45d16c70c5fe6f70e12cbafe337e08be4f0b08d7711c0f7783d35a51b4a', 
        'ddcinfo': 'xMBPaen8FeTm6vYl5KB4SkwR6MopzTW6B4xftQZiR00hZ7pBeP3pFtJnUFr2+Yt546TiWLrDjuUFEpcT/5v5cvoxitP+lkdiH4OFxnVCnKzS/6ITtib9C9qAehvzs015KdqCcxmFCSI0kfBLAbvkD77I3foT4v3EWiAbqQ/mPL3RKqFHcZLnGVkw2YifTurcHc8N9k7T7HY+VpdD94ZZNfomf31Qr7Txyvd3w/iQmTMCNZRtiGLrksOeLET5ESgK/xylncdN//mDgqUjP2LTO7CTp+wk3oR0aL6Q1e7rYIccKSWDRiTu/gqFoW9Yao1gCOmnzl04lXJ6fPYaISWmnredQhBLNr8Y+RsSSdUal/jOiWT2BOJnEmoI1RTamGWeyt9OlUuj3VBbS/OPCBAesjaLqBf73TsgKPROhqBAyHCxTCrG9pXYtebcidc/UdEGw77lG/XEtOWeQStVY5bca1MJmwu8oIlAm2jqlZR/l0f5nfCmcnHu8LuyRZxU7KUPHrnML1dqsevrTR3TLlVGpI08NKjj1GPpB+LguPsugA2seilYtyNuBaJ7g4VmO7fka0bVCykS5dtxym0dDhwhw4aYKagBAUlbJcHHvL5ys5Y3l2rYlsGRa5L8MUNNHxX69k+t6SfS6HmsFTco0zSBBpDswVwm++zBPwj8jXgZDR9mwPDDJ2i/J0tbn1xGV4vF1VVMMg4Qc4b8Fcm2Q7mKkhlGUvCERUm/89DdmatGC9hGXjE0CdPTIP00KI36s1YdBwXFBsBLdujn4xw3z67vtx+8qIN+GdHEHD+hG4PWQR3RAsqJ46Bo3hs6dJSsB0TaIqyLDCWhcPgnbCzq2Jdq7DkCNKyq31gdrx34B82muwk9igGdAwVqhlgmJzjWE4puJ0Jixh9i/pwh6ksqdTTBTlSBDIH4ruq4Me7620Y+KPDdu5wP82ux+alqGWdehoN/n/3DzC5dffa5ev9S0exp4twqgi+Lpz8rth/R4Z34onokzjYoykYrwwBs14qoGRh5', 
        'accept-language': 'en-FR;q=1, zh-Hans-FR;q=0.9, zh-Hant-FR;q=0.8, fr-FR;q=0.7', 
        'authorization': 'Bearer DadQysahmfxzlREoUypF54LHduBOhvq/8gqsEUNIIAai7kDtghhfvrRvjCFIWu+IaTg5QFhDQz6Vw2y+Xb/McmGLRRY6agvCu6r0N+7asLBvMt80jcsYVCYoOpK2Df3S', 
        'sign': 'd5c8a3819d85c46e88624ccd30635788 1706452933 carpool', 
        'accept': '*/*', 
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) DidaCronet/0.0.1 Mobile/15E148 Safari/604.1'
    },
    // 附近订单
    NEAR: {
        'Host': 'capis-1.didapinche.com', 
        'Cookie': '__clickidc=155075955653883511', 
        'ddcinfo': 'xMBPaen8FeTm6vYl5KB4SkwR6MopzTW6B4xftQZiR00hZ7pBeP3pFtJnUFr2+Yt546TiWLrDjuUFEpcT/5v5cvoxitP+lkdicybfkNN45z4tgqKWEbjWeiD3dnYLstjQA6rWrZWVkvfnrT7wZ1SnKamR4qwuZ015C6a9zOkuqywtlEfzLrnZtq+Vj3GFkpsatD7SAYkoc9ZPwen2fFouVX65t6PAeyDJ1N+DfHgCBog5oFF0YuLrvoKQT8NnLPdVXjSt0Oz7olcO/W6X9WzToBy6xtLo9Rm0/pfDWJ7xDlwcCV9xf+I48gSr21tOHPALFvkI2qxiCi/T60EbvIX5fPXWAZ4izm/91U5mYuQdar/Z/lhvDUqSNPi7Z4wLYX281lxS/F2ch4/SlSDhKwISUhnJg0fc7myJFnrP7FzZKugZZOwK4sc7wDTHJgFj1W1lLs13XbHngB1gMZ7VYNKIr2Lp6xFk7kje4hiOZ7r38mk6Ohmo+WoBBkbE8o8KH4+5ly5Ljr/9kbMAuMwPyi/WlB5R9dGjai9vED+tBvVzAGHFVWoonMUmMfzxI99Bv/NOf5s4dDNgQCBrijLP2x7nqdejm7T5Pk6Q88ayURju3WY5wbjXJaDbfZgUHzGUKUA3rPhkjOqH+VteFYlfdRMrEia4nbFEQNB17i2nd/ttwNO7h9vKr0yZChx1LZtS1O1qsg75Qth2MrVgc3TDIW2rTzS/TT13rLTOBhWKjjQp2mIOeAba+bkEEHrOeF93EnxWqL/fergMSkhajBUQ6hDVjgLBHvkmPBY32ywJQILt4JYN15Lg8Lu2JHK4mWiqIpLEuifMzXQZYgIl44L7xGFmpO/Ez+R/Msl/Eft2olXGvQ1vfKayo+P/zFiIEyjsQSEBC+lObAzv2bVzhH82LrNIr9eB5p2E/yo1ZPPlx5++ukr8EVijsvben4WC9a6Ondom6JzsN1P6p/rIyYIZBFqpzN7aHFn7F+EixKUgrdZaTwe2ggwebl6vCktVdiFO3e5b', 
        'accept-language': 'en-FR;q=1, zh-Hans-FR;q=0.9, zh-Hant-FR;q=0.8, fr-FR;q=0.7', 
        'authorization': 'Bearer DadQysahmfxzlREoUypF54LHduBOhvq/8gqsEUNIIAai7kDtghhfvrRvjCFIWu+IaTg5QFhDQz6Vw2y+Xb/McmGLRRY6agvCu6r0N+7asLBvMt80jcsYVCYoOpK2Df3S', 
        'sign': '10a92c2d9a8fe0fe1a6be9389c6fc41b 1706960310 carpool', 
        'accept': '*/*', 
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) DidaCronet/0.0.1 Mobile/15E148 Safari/604.1'
    }
};

const FETCH_CONF = {
    WORK: {
        url: `https://capis-2.didapinche.com/carpool/list/driver/work?${objectToQueryString(def_query)}`,
        method: 'get',
        maxBodyLength: Infinity,
        headers: HEADERS_MAP.WORK
    },
    HOME: {
        url: `https://capis-2.didapinche.com/carpool/list/driver/work?${objectToQueryString({
            ...def_query,
            day_filter: 1,
            ride_type: 2
        })}`,
        method: 'get',
        maxBodyLength: Infinity,
        headers: HEADERS_MAP.HOME
    },
    NEAR: {
        method: 'get',
        maxBodyLength: Infinity,
        headers: HEADERS_MAP.NEAR ,
        url: 'https://capis-1.didapinche.com/carpool/list/driver/nearby?center_latitude=31.084285&center_longitude=121.511832&filter_by=all&order_by=default&page=1&page_size=20&rideType=0&search_type=0&timeRange=0&user_cid=cca525a1-ff00-4a4e-a0bd-44c9ea244405'
    }
};

const FILE_PATH = {
    HOME: './data/2_home.json',
    WORK: './data/2_work.json',
    NEAR: './data/near_by.json'
};

const carListFetch = async type => {
    const response = await axios.request(FETCH_CONF[type]);
    const listData = _.get(response, 'data.list', [])
        .map(item => dataFormatHelper(item))
        .forEach(async (item) => {
            // 不写入重复数据
            const exist = await containCertainStr(FILE_PATH[type], _.get(item, 'passenger_user_info.cid'));
            !exist && await appendContent(FILE_PATH[type], item);
        });
}
module.exports = {
    dataFormatHelper,
    containCertainStr,
    appendContent,
    carListFetch
};
