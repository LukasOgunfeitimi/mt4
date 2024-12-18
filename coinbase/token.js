const crypto = require('crypto');
const { sign } = require('jsonwebtoken');

const { name, privateKey } = {
    "name": "organizations/c57756f9-06dc-4337-8293-5fa21aa93a73/apiKeys/15887993-0652-4605-87f1-4ddca136a7d1",
    "privateKey": "-----BEGIN EC PRIVATE KEY-----\nMHcCAQEEICZsejIaIYknr2Vo9ztMKA3L/OJO+nOyjsZnKL2qLokRoAoGCCqGSM49\nAwEHoUQDQgAE9x9eM6EOs1Qlrzyb8QI3DzWzJNo1rGbpeS5ILBgyTgN87mCwTT87\nQq4UUEjQnWoFs9Rs9sDjLm5qYDygO8o4sA==\n-----END EC PRIVATE KEY-----\n"
};

function generateToken(method, url, path) {
    const algorithm = "ES256";
    const uri = `${method} ${url}${path}`;

    return sign({
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

module.exports = generateToken;