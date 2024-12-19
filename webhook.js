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

const wh = '';

const headers = {
    'Content-type': 'application/json'
}

const avatar_urls = {
    1: "https://i.imgur.com/4GXdH9F.png",
    2: "https://i.imgur.com/DaCG08H.png",
}

function send(type, name, msg) {
    const payload = {
        username: name,
        avatar_url: avatar_urls[type],
        content: '<@109213512366071808> ' + msg 
    }
    req(wh, headers, 'POST', JSON.stringify(payload)).then(e => {
        console.log(e);
    })
}

module.exports = send
