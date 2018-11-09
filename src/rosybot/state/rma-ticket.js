// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

class RmaTicket {
	/**
	 *
	 * @param {String} Product name
	 */
	constructor(productName) {

		if (!productName) throw new Error('No product name provided.');

		this.productName = productName;
		this.dateRequested = Date.now();
		this.status = "Created";
		this.ticketId = `NTL${Math.floor(10000 + Math.random() * 90000)}`;
	}

	toSummary()
	{
		return `${this.ticketId}: ${this.productName} - ${this.status}`;
	}
};

module.exports.RmaTicket = RmaTicket;