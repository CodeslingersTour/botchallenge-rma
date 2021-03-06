// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const { LuisRecognizer } = require('botbuilder-ai');
const { ActivityTypes } = require('botbuilder');
const { CardFactory } = require('botbuilder');
const { RmaTicketDialog } = require('./dialogs/rma-ticket-dialog');
const { QnaDialog } = require('./dialogs/qna-dialog');
let appInsights = require('applicationinsights');
// let adaptiveCards = require("adaptivecards");
appInsights.setup('072a7980-936a-4fb9-8dc0-5b0f7abe3b15').start();
const telemetryClient = appInsights.defaultClient;


const GreetingCard = require('./assets/greetingCard.json');


// this is the LUIS service type entry in the .bot file.
const RMA_TICKET_INTENT = 'l_RosyBot-RMA';
const NONE_INTENT = 'None';
const RMA_QNA_INTENT = 'q_RosyBot_RMA_FAQ';
const RMA_CHITCHAT_INTENT = 'q_RosyBot_Chit_Chat';
const DISPATCH_CONFIG = 'RosyBotDispatch';

const RMA_QNA_CONFIG = 'RosyBot RMA FAQ';
const CHITCHAT_CONFIG = 'RosyBot Chit Chat';

const GUIDANCE_MESSAGE = `You can ask me FAQs or tell me to 'create an RMA ticket for a laptop' or 'Lookup RMA ticket 895784625'`;
const GREETING_MESSAGE = `Hi, I'm Rosy the bot!`;
const CONFUSED_MESSAGE = `I don't understand. Can you please rephrase?`;

class RosyBot {
	/**
	 *
	 * @param {ConversationState}  conversation state
	 * @param {UserState} user state
	 * @param {BotConfiguration} bot configuration from .bot file
	 */
	constructor(conversationState, userState, botConfig) {
		if (!conversationState) throw new Error(`Missing parameter. Conversation state parameter is missing`);
		if (!userState) throw new Error(`Missing parameter. User state parameter is missing`);
		if (!botConfig) throw new Error(`Missing parameter. Bot configuration parameter is missing`);

		this.rmaTicketDialog = new RmaTicketDialog(conversationState, userState, botConfig);
		this.rmaQnaDialog = new QnaDialog(botConfig, RMA_QNA_CONFIG);
		this.chitChatDialog = new QnaDialog(botConfig, CHITCHAT_CONFIG);

		this.conversationState = conversationState;
		this.userState = userState;

		// dispatch recognizer
		const dispatchConfig = botConfig.findServiceByNameOrId(DISPATCH_CONFIG);
		if (!dispatchConfig || !dispatchConfig.appId) throw new Error(`No dispatch model found in .bot file. Please ensure you have dispatch model created and available in the .bot file. See readme.md for additional information\n`);
		this.dispatchRecognizer = new LuisRecognizer({
			applicationId: dispatchConfig.appId,
			endpoint: dispatchConfig.getEndpoint(),
			// CAUTION: Its better to assign and use a subscription key instead of authoring key here.
			endpointKey: dispatchConfig.authoringKey
		});
		
		
		

	}

	/**
	 * Driver code that does one of the following:
	 * 1. Calls dispatch LUIS model to determine intent
	 * 2. Calls appropriate sub component to drive the conversation forward.
	 *
	 * @param {TurnContext} context turn context from the adapter
	 */
	async onTurn(turnContext) {
		if (turnContext.activity.type === ActivityTypes.Message) {

			if (this.rmaTicketDialog.isInWaterfall) {
				await this.rmaTicketDialog.onTurn(turnContext);
			} else {
				// determine which dialog should fulfill this request
				// call the dispatch LUIS model to get results.
				const dispatchResults = await this.dispatchRecognizer.recognize(turnContext);
				const dispatchTopIntent = LuisRecognizer.topIntent(dispatchResults);
				switch (dispatchTopIntent) {
					case RMA_TICKET_INTENT:
						telemetryClient.trackEvent({name: "ROSYBOT_RMA_TICKET_INTENT"});
						await this.rmaTicketDialog.onTurn(turnContext);
						break;
					case RMA_QNA_INTENT:
						telemetryClient.trackEvent({name: "ROSYBOT_RMA_QNA_INTENT"});
						await this.rmaQnaDialog.onTurn(turnContext);
						break;
					case RMA_CHITCHAT_INTENT:
						telemetryClient.trackEvent({name: "ROSYBOT_RMA_CHITCHAT_INTENT"});
						await this.chitChatDialog.onTurn(turnContext);
						break;
					case NONE_INTENT:
					default:
						// Unknown request
						telemetryClient.trackEvent({name: "ROSYBOT_UNKNOWN_INTENT"});
						await turnContext.sendActivity(CONFUSED_MESSAGE);
						await turnContext.sendActivity(GUIDANCE_MESSAGE);
				}
			}

			// save state changes
			await this.conversationState.saveChanges(turnContext);
			await this.userState.saveChanges(turnContext);
		} else if (turnContext.activity.type === ActivityTypes.ConversationUpdate) {
			// Handle ConversationUpdate activity type, which is used to indicates new members add to
			// the conversation.
			// see https://aka.ms/about-bot-activity-message to learn more about the message and other activity types

			// Do we have any new members added to the conversation?
			if (turnContext.activity.membersAdded.length !== 0) {
				// Iterate over all new members added to the conversation
				for (var idx in turnContext.activity.membersAdded) {
					// Greet anyone that was not the target (recipient) of this message
					// the 'bot' is the recipient for events from the channel,
					// turnContext.activity.membersAdded == turnContext.activity.recipient.Id indicates the
					// bot was added to the conversation.
					if (turnContext.activity.membersAdded[idx].id !== turnContext.activity.recipient.id) {
						// Welcome user.
						// When activity type is "conversationUpdate" and the member joining the conversation is the bot
						// we will send our Welcome Adaptive Card.  This will only be sent once, when the Bot joins conversation
						// To learn more about Adaptive Cards, see https://aka.ms/msbot-adaptivecards for more details.
						
						await turnContext.sendActivity({attachments: [CardFactory.adaptiveCard(GreetingCard)]});
						// await turnContext.sendActivity(GUIDANCE_MESSAGE);
					}
				}
			}
		}
	}
}

module.exports.RosyBot = RosyBot;
