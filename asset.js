const send = require('./webhook.js')

class Asset {     
    constructor(name, id, digits) {
        this.name = name;
        this.id = id;
        this.digits = digits;
        this.bid;
        this.ask;
        this.history = [];
        this.historyInterval = 1000 * 60; // how often do we log a new price
        this.historyMaxLength = 60; // how many times we log historyInterval until we delete the oldest price
        this.diffThreshold;
        this.shown = false;
    }
    processNewPrice({timeStamp, bid}) {
        const lastPrice = this.history[this.history.length - 1];

        if (!lastPrice) {
            this.history.push({timeStamp, bid});
            return;
        }

        const getLatestMinute = lastPrice.timeStamp
        const priceMinute = timeStamp;
        
        if (!this.shown) {
            this.shown = true;
            console.log(this.name + " " + bid);
        }
        
        if (!(priceMinute > getLatestMinute + this.historyInterval)) return;

        const price = { timeStamp, bid}

        if (this.history.length === this.historyMaxLength) this.history.shift();
        this.history.push(price);

        for (let i = this.history.length - 2; i >= 0; i--) {
            const oldPrice = this.history[i].bid;

            const diff = (bid - oldPrice).toFixed(this.digits);
            //const diff = Math.abs((bid - oldPrice) / oldPrice * 100).toFixed(2); // % diff
            if (Math.abs(diff) < this.diffThreshold) continue;

            const direction = diff > 0 ? '+' : '';
            const change = `${this.name} ${direction}${diff}`;
            const prices = `Old: ${oldPrice} New: ${price.bid}`;

            send(1, change, change + '\n' + prices);
            console.log('Old: ' + oldPrice + ' New: ' + bid + ' Diff: ' + Math.abs(diff));
            this.history = [];
            break;
        }
    }
}

module.exports = Asset;