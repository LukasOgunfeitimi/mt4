const fetch = require('node-fetch');
const { sign } = require('jsonwebtoken');
const crypto = require('crypto');

const { name, privateKey } = {
  "name": "organizations/c57756f9-06dc-4337-8293-5fa21aa93a73/apiKeys/573d5cef-4746-4a59-8975-f1624816f092",
  "privateKey": "-----BEGIN EC PRIVATE KEY-----\nMHcCAQEEIM5pHy85tcwVYd+Kmwlh/a4ebhxl1VX76cMQwEDkB+YdoAoGCCqGSM49\nAwEHoUQDQgAE4BF+Y9aZGeBMNH+8CIjtkvbv1YXhf4duWAbe0LZy3ABMhJZr289S\n5V/peVe7xlMmawX9EOUBTlM6GbEUdGyVmA==\n-----END EC PRIVATE KEY-----\n"
};

function generateToken(method, url, path) {
  const algorithm = "ES256";
  const uri = `${method} ${url}${path}`;

  return sign(
    {
      iss: "cdp",
      nbf: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 120,
      sub: name,
      uri,
    },
    privateKey,
    {
      algorithm,
      header: {
        kid: name,
        nonce: crypto.randomBytes(16).toString("hex"),
      },
    }
  );
}

function req(url, method, payload) {
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
          throw new Error(`Request failed: ${res.statusText}`);
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

const portfolio_uuid = '48c3e762-030b-532e-9bfe-784d71231c3d';
const account_uuid = '088f02f0-d1bd-5de5-b0ad-3ae2fefaba05';

const isEmpty = (obj) => Object.keys(obj).length === 0;

const start = new Date('2024-11-20T20:00:00');

const getAmounts = data => 
  data.filter(s => s.status === "completed" && new Date(s.created_at) > start)
      .reduce((total, s) => total + parseFloat(s.amount?.amount || 0), 0);


const getCoinbase = async () => {
  const baseUrl = 'https://api.coinbase.com';

  const balanceRes = await req(`${baseUrl}/api/v3/brokerage/portfolios/${portfolio_uuid}`, 'GET');
  const depositsRes = await req(`${baseUrl}/v2/accounts/${account_uuid}/deposits`, 'GET');
  const withdrawalsRes = await req(`${baseUrl}/v2/accounts/${account_uuid}/withdrawals`, 'GET');

  if (isEmpty(balanceRes) || isEmpty(depositsRes) || isEmpty(withdrawalsRes)) return;

  const balance = parseFloat(balanceRes.breakdown.portfolio_balances.total_balance.value);
  const deposits = getAmounts(depositsRes.data);
  const withdrawals = getAmounts(withdrawalsRes.data);

  const profit = Math.round(balance - (deposits - withdrawals), 2);

  const data = { balance, deposits, withdrawals, profit };

  console.log(data);

  return data;
};

module.exports = getCoinbase;
