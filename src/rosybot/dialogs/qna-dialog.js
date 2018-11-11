// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const { QnAMaker } = require('botbuilder-ai');

const QNA_TOP_N = 1;
const QNA_CONFIDENCE_THRESHOLD = 0.5;


class QnaDialog {
	/**
	 *
	 * @param {Object} botConfig bot configuration from .bot file
	 */
	constructor(botConfig, kbConfigName) {
		if (!botConfig) throw new Error('Need bot config');
		if (!kbConfigName) throw new Error('Need kb config name in .bot file');

		// add recognizers
		const qnaConfig = botConfig.findServiceByNameOrId(kbConfigName);
		if (!qnaConfig || !qnaConfig.kbId) throw new Error(`QnA Maker application information not found in .bot file. Please ensure you have all required QnA Maker applications created and available in the .bot file. See readme.md for additional information\n`);
		this.qnaRecognizer = new QnAMaker({
			knowledgeBaseId: qnaConfig.kbId,
			endpointKey: qnaConfig.endpointKey,
			host: qnaConfig.hostname
		});
	}
	/**
	 *
	 * @param {TurnContext} turn context object
	 */
	async onTurn(turnContext) {
		// Call QnA Maker and get results.
		const qnaResult = await this.qnaRecognizer.generateAnswer(turnContext.activity.text, QNA_TOP_N, QNA_CONFIDENCE_THRESHOLD);
		if (!qnaResult || qnaResult.length === 0 || !qnaResult[0].answer) {
			await turnContext.sendActivity(`No answer found in QnA Maker KB.`);
			return;
		}
		// respond with qna result
		await turnContext.sendActivity(qnaResult[0].answer);
	}
};

module.exports.QnaDialog = QnaDialog;