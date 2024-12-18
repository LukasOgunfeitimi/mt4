const fetch = require('node-fetch');
const generateToken = require('./token.js');
const baseUrl = 'https://api.coinbase.com';
    
function req(url, method = 'GET', payload) {
    const token = generateToken(method, "api.coinbase.com", new URL(url).pathname);  
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
    };

    const options = {
        method,
        headers,
    };
    if (payload) options.body = JSON.stringify(payload);

    return new Promise((resolve) => {
        fetch(url, options)
        .then(async (res) => {
            if (!res.ok) {
            //throw new Error(`Request failed: ${res.statusText}`);
            }
            return res.json();
        })
        .then((data) => resolve(data))
        .catch((error) => {
            console.error('Error:', error.message);
            resolve({}); 
        });
    });
}

module.exports = req;