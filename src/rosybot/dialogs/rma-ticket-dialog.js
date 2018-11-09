// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const { LuisRecognizer } = require('botbuilder-ai');
const { RmaTicket } = require('../state/rma-ticket');
const { RmaTicketState } = require('../state/rma-ticket-state');

// LUIS intent names. you can get this from the .lu file.
const CREATE_RMA_TICKET_INTENT = 'CreateRmaTicket';
const LOOKUP_RMA_TICKET_INTENT = 'LookupRmaTicket';
const NONE_INTENT = 'None';

// LUIS entity names.
const PRODUCT_ENTITY = 'Product';
const TICKETID_ENTITY = 'RmaNumber';

// this is the LUIS service type entry in the .bot file.
const LUIS_CONFIGURATION = 'RosyBot-RMA';

class RmaTicketDialog {
	/**
	 *
	 * @param {ConversationState} convoState conversation state
	 * @param {UserState} userState user state
	 * @param {BotConfiguration} botConfig bot configuration from .bot file
	 */
	constructor(convoState, userState, botConfig) {
		if (!convoState) throw new Error('Need conversation state');
		if (!userState) throw new Error('Need user state');
		if (!botConfig) throw new Error('Need bot config');

		// home automation state
		this.state = new RmaTicketState(convoState, userState);

		// add recognizers
		const luisConfig = botConfig.findServiceByNameOrId(LUIS_CONFIGURATION);
		if (!luisConfig || !luisConfig.appId) throw new Error(`LUIS model not found in .bot file. Please ensure you have all required LUIS models created and available in the .bot file. See readme.md for additional information\n`);
		this.luisRecognizer = new LuisRecognizer({
			applicationId: luisConfig.appId,
			azureRegion: luisConfig.region,
			// CAUTION: Its better to assign and use a subscription key instead of authoring key here.
			endpointKey: luisConfig.authoringKey
		});
	}
	/**
	 *
	 * @param {TurnContext} turn context object
	 */
	async onTurn(turnContext) {
		// make call to LUIS recognizer to get intent + entities
		const luisResults = await this.luisRecognizer.recognize(turnContext);
		const topIntent = LuisRecognizer.topIntent(luisResults);

		// depending on intent, call turn on or turn off or return unknown
		switch (topIntent) {
			case CREATE_RMA_TICKET_INTENT:
				await this.handleCreateRmaTicket(luisResults, turnContext);
				break;
			case LOOKUP_RMA_TICKET_INTENT:
				await this.handleLookupRmaTicket(luisResults, turnContext);
				break;
			case NONE_INTENT:
			default:
				await turnContext.sendActivity(`None intent hit`);
		}
	}
	/**
	 *
	 * @param {RecognizerResults} luisResults results from LUIS recognizer
	 * @param {TurnContext} context context object
	 */
	async handleCreateRmaTicket(luisResults, context) {
		// Find entities from the LUIS model
		// The LUIS language understanding model is set up with both machine learned simple entities as well as pattern.any entities.
		// Check to see if either one has value. In cases where both have value, take the machine learned simple entities value.
		const productName = findEntities(PRODUCT_ENTITY, luisResults.entities);

		if (productName === undefined) {
			await context.sendActivity(`No product name provided. Please try again.`);
		}
		else {

			let ticket = new RmaTicket(productName, 'defective');
			await this.state.saveRmaTicket(ticket, context);
			await context.sendActivity(`Here is the status of your new RMA ticket:`);
			await context.sendActivity(ticket.toSummary());
		}
	}

	/**
	 *
	 * @param {RecognizerResults} luisResults results from LUIS recognizer
	 * @param {TurnContext} context context object
	 */
	async handleLookupRmaTicket(luisResults, context) {

		const entities = findEntities(TICKETID_ENTITY, luisResults.entities);
		let ticketId = null;

		if(entities.length > 0)
			ticketId = entities[0];

		if(!ticketId){
			await context.sendActivity(`Please specify a ticket ID`);
			return;
		}

		var ticket = await this.state.getRmaTicket(ticketId, context);

		if(!ticket) {
			await context.sendActivity(`I couldn't find an RMA ticket with the ID ${ticketId}`);
		}
		else {
			await context.sendActivity(`Here is the status of your RMA ticket:`);

			var desc = `Product: ${ticket.productName}\nDate requestd: ${ticket.dateRequested.toString()}\nStatus: ${ticket.status}`;
			await context.sendActivity(desc);
		}
	}
};

module.exports.RmaTicketDialog = RmaTicketDialog;




// Helper function to retrieve specific entities from LUIS results
function findEntities(entityName, entityResults) {
	let entities = [];
	if (entityName in entityResults) {
		entityResults[entityName].forEach(entity => {
			entities.push(entity);
		});
	}
	return entities.length > 0 ? entities : undefined;
}