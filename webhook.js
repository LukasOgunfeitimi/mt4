const fetch = require('node-fetch')

function req(url, headers, method, payload, ops={method: method, headers: headers}) {
    if (payload) ops.body = payload
    return new Promise((resolve)=>{
        fetch(url,ops).then(async res=>{
            setCookie = res.headers.get('set-cookie')
            return res.text()
        }).then(msg=>resolve(msg))
    })
}

const wh = 'https://discord.com/api/webhooks/1259628968508788908/Fu60NYaw7JMIeKYpSn0Q-kFVkPQyrE5vFlUjt0Ozt2aAetvAiofBfZaeRbxzHTU9kau9';

const headers = {
    'Content-type': 'application/json'
}


function send(name, msg) {
    const payload = {
        username: name,
        avatar_url: "https://i.imgur.com/4GXdH9F.png",
        content: '<@109213512366071808> ' + msg 
    }
    req(wh, headers, 'POST', JSON.stringify(payload)).then(e => {
        console.log(e);
    })
}

module.exports = send