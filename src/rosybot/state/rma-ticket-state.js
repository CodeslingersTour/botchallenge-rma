// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { RmaTicket } = require('./rma-ticket');
const RMA_TICKET_PROPERTY = 'rmaTicket.state';

class RmaTicketState {

	constructor(conversationState, userState) {
		if (!conversationState) throw new Error('Invalid conversation state provided.');
		if (!userState) throw new Error('Invalid user state provided.');

		// Device property accessor for home automation scenario.
		this.rmaTicket = conversationState.createProperty(RMA_TICKET_PROPERTY);
	}

	async saveRmaTicket(ticket, context) {
		return this.rmaTicket.set(context, ticket);
	}

	async getRmaTicket(context) {
		var ticket = await this.rmaTicket.get(context);
		return ticket;
	}
}

module.exports.RmaTicketState = RmaTicketState;