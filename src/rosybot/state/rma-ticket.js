// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
var dateFormat = require('dateformat');

class RmaTicket {
	
	constructor(productName) {

		if (!productName) throw new Error('No product name provided.');

		this.issue = '';
		this.productName = productName;
		this.dateRequested = Date.now();
		this.status = "Created";
		this.ticketId = `NTL${Math.floor(10000 + Math.random() * 90000)}`;
	}

	toSummary()
	{
		let desc = `Product: ${this.productName}\nDate requested: ${dateFormat(this.dateRequested)}\nStatus: ${this.status}`;
		return desc;
	}
};

module.exports.RmaTicket = RmaTicket;