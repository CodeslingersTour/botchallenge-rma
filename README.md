# botchallenge-rma
Microsoft Bot Framework v4 Challenge - Return Merchandise Authorization

### Functional Requirements

#### Here are some steps to help you build out Rosy:

1. Get a node or C# Echo Bot sample running locally
1. Import a [FAQ](https://www.intel.com/content/www/us/en/support/articles/000006268/services.html) data source into [QnA Maker](http://qnamaker.ai) and integrate it into your bot and ensure the bot is providing correct answers
1. Build a [LUIS](http://luis.ai) model for creating RMA tickets using luis.ai
1. In code, create a dialog for both your QnA KB and your LUIS intent
1. Use [dispatch](https://github.com/Microsoft/botbuilder-tools/tree/master/packages/Dispatch) to determine which dialog to invoke
1. Ensure your bot is providing accurate responses, creating RMA tickets, etc