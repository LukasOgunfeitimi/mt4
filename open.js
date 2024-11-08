const child_process = require('child_process');

const symbol = ['US30', 'GBPJPY', 'XAUUSD'];

const payload = 'https://www.tradingview.com/chart/6j8GIbhU/?symbol=';

(async () => {
    for (const s of symbol) {
        open(payload + s);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
})();

function open(url) {
    child_process.exec(`start chrome "${url}"`);
}
