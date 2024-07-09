class Asset {
    constructor(name, id, digits) {
        this.name = name;
        this.id = id;
        this.digits = digits;
        this.bid;
        this.ask;
        this.history = [];
    }
}

module.exports = Asset;