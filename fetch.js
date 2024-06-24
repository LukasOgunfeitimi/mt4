const fetch = require('node-fetch')


module.exports = (login, server) => {
    return fetch("https://metatraderweb.app/trade/json", {
    "headers": {
      "accept": "*/*",
      "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
      "content-type": "application/x-www-form-urlencoded",
      "sec-ch-ua": "\"Google Chrome\";v=\"119\", \"Chromium\";v=\"119\", \"Not?A_Brand\";v=\"24\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "cookie": "_fz_uniq=5188426201580743742; _fz_fvdt=1699563630; _fz_ssn=1700875826366010805",
      "Referer": "https://metatraderweb.app/trade",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": `login=${login}&trade_server=${server}&gwt=2`,
    "method": "POST"
  })
}