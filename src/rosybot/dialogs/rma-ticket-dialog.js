// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
var dateFormat = require('dateformat');
const { LuisRecognizer } = require('botbuilder-ai');
const { ChoicePrompt, DialogSet, NumberPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { RmaTicket } = require('../state/rma-ticket');

// LUIS intent names. you can get this from the .lu file.
const CREATE_RMA_TICKET_INTENT = 'CreateRmaTicket';
const LOOKUP_RMA_TICKET_INTENT = 'LookupRmaTicket';
const NONE_INTENT = 'None';

// LUIS entity names.
const PRODUCT_ENTITY = 'Product';
const TICKETID_ENTITY = 'RmaNumber';

// this is the LUIS service type entry in the .bot file.
const LUIS_CONFIGURATION = 'RosyBot-RMA';

const CREATE_RMA_TICKET_WATERFALL = 'create_rma';
const PRODUCT_NAME_PROMPT = 'product_name_prompt';
const REASON_PROMPT = 'reason_prompt';

const DIALOG_STATE_PROPERTY = 'dialog.state';
const TICKET_STATE_PROPERTY = 'ticket.state';


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

		this.conversationState = convoState;
		// add recognizers
		const luisConfig = botConfig.findServiceByNameOrId(LUIS_CONFIGURATION);
		if (!luisConfig || !luisConfig.appId) throw new Error(`LUIS model not found in .bot file. Please ensure you have all required LUIS models created and available in the .bot file. See readme.md for additional information\n`);
		this.luisRecognizer = new LuisRecognizer({
			applicationId: luisConfig.appId,
			azureRegion: luisConfig.region,
			// CAUTION: Its better to assign and use a subscription key instead of authoring key here.
			endpointKey: luisConfig.authoringKey
		});

		this.isInWaterfall = false;
		this.dialogState = this.conversationState.createProperty(DIALOG_STATE_PROPERTY);
		this.ticketState = this.conversationState.createProperty(TICKET_STATE_PROPERTY);
		this.dialogs = new DialogSet(this.dialogState);

		this.dialogs.add(new TextPrompt(PRODUCT_NAME_PROMPT));
		this.dialogs.add(new TextPrompt(REASON_PROMPT));

		this.dialogs.add(new WaterfallDialog(CREATE_RMA_TICKET_WATERFALL, [
			this.promptForProductName.bind(this),
			this.promptForReason.bind(this),
			this.confirmRmaCreated.bind(this),
		]));
	}
	/**
	 *
	 * @param {TurnContext} turn context object
	 */
	async onTurn(turnContext) {

		if(this.isInWaterfall) {
			const dc = await this.dialogs.createContext(turnContext);
			await dc.continueDialog();
		} else {
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
	}
	/**
	 *
	 * @param {RecognizerResults} luisResults results from LUIS recognizer
	 * @param {TurnContext} context context object
	 */
	async handleCreateRmaTicket(luisResults, context) {

		this.isInWaterfall = true;
		const results = findEntities(PRODUCT_ENTITY, luisResults.entities);

		let productName = null;
		if(results && results.length > 0) productName = results[0];
		let ticket = new RmaTicket(productName);
		await this.ticketState.set(context, ticket);

		const dc = await this.dialogs.createContext(context);
		await dc.beginDialog(CREATE_RMA_TICKET_WATERFALL);
	}

	async promptForProductName(step) {
		const ticket = await this.ticketState.get(step.context, {});
		if (ticket.productName && ticket.productName.length > 1) {
			return await step.next();
		} else {
			return await step.prompt(PRODUCT_NAME_PROMPT, `What is the name of the product?`);
		}
	}

	async promptForReason(step) {
		const ticket = await this.ticketState.get(step.context, {});
		if(!ticket.productName && step.result) ticket.productName = step.result;
		await this.ticketState.set(step.context, ticket);

		if (ticket.reason && ticket.reason.length > 1) {
			return await step.next();
		} else {
			return await step.prompt(REASON_PROMPT, `What is the reason you are returning the ${ticket.productName}?`);
		}
	}

	async confirmRmaCreated(step) {
		const ticket = await this.ticketState.get(step.context, {});
		if (!ticket.reason && step.result) ticket.reason = step.result;

		await this.ticketState.set(step.context, ticket);

		await step.context.sendActivity(`Ok, I've created an RMA ticket for the ${ticket.productName}. Here are the details:`)
		await step.context.sendActivity(this.getTicketSummary(ticket));
		await step.context.sendActivity(`Remember, you can always ask me the status of the ticket anytime.`);

		this.isInWaterfall = false;
		return await step.endDialog();
	}

	/**
	 *
	 * @param {RecognizerResults} luisResults results from LUIS recognizer
	 * @param {TurnContext} context context object
	 */
	async handleLookupRmaTicket(luisResults, context) {

		const ticket = await this.ticketState.get(context, {});

		if(!ticket || !ticket.ticketId) {
			// await context.sendActivity(`I couldn't find an RMA ticket with the ID ${ticketId}`);
			await context.sendActivity(`You don't have any open RMA tickets`);
		}
		else {
			await context.sendActivity(`Here is the status of your RMA ticket:`);
			await context.sendActivity(this.getTicketSummary(ticket));
		}
	}

	getTicketSummary(ticket) {
		let date = new Date(ticket.dateRequested);
		let desc = `Product: ${ticket.productName}\nReason: ${ticket.reason}\nDate requested: ${dateFormat(date)}\nStatus: ${ticket.status}`;
		return desc;
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