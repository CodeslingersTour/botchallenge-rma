// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { RmaTicket } = require('./rma-ticket');
const RMA_TICKET_PROPERTY = 'rmaTicket.state';

class RmaTicketState {
	/**
	 *
	 * @param {ConversationState} convoState Conversation state
	 * @param {UserState} userState User state
	 */
	constructor(conversationState, userState) {
		if (!conversationState) throw new Error('Invalid conversation state provided.');
		if (!userState) throw new Error('Invalid user state provided.');

		// Device property accessor for home automation scenario.
		this.rmaTickets = conversationState.createProperty(RMA_TICKET_PROPERTY);
	}

	/**
	 *
	 * @param {RmaTicket} ticket
	 * @param {TurnContext} context object
	 */
	async saveRmaTicket(ticket, context) {

		// Get tickets from state.
		let tickets = await this.rmaTickets.get(context);
		if (tickets === undefined) {
			tickets = new Array(ticket);
		} else {
			// add this ticket
			operations.push(ticket);
		}

		return this.rmaTickets.set(context, tickets);
	}

	/**
	 *
	 * @param {TurnContext} context object
	 * @returns {String} text readout of state operations
	 */
	async getRmaTickets(context) {
		let returnText = 'You have not created any RMA tickets.';

		// read out of current tickets from state
		const tickets = await this.rmaTickets.get(context);
		if (tickets === undefined) {
			return returnText;
		}

		returnText = '';
		tickets.forEach((ticket, i) => {
			returnText += `\n${i}. ${ticket.toSummary()}`;
		});

		return returnText;
	}

	async getRmaTicket(ticketId, context) {

		const tickets = await this.rmaTickets.get(context);
		if (tickets === undefined) {
			return null;
		}

		let ticket = tickets.find(t => t.ticketId.toUpperCase() === ticketId.toUpperCase());
		return ticket;
	}
}

module.exports.RmaTicketState = RmaTicketState;