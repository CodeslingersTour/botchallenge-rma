# botchallenge-rma
Microsoft Bot Framework v4 Challenge - Return Merchandise Authorization

### Functional Requirements

Rosy should be able to:
* Greet the user
* Create an RMA ticket
* Look up the status of an existing RMA ticket

#### Here are some steps to help you build out Rosy:

1. Get a node or C# Echo Bot sample running locally
1. Import a [FAQ](https://www.intel.com/content/www/us/en/support/articles/000006268/services.html) data source into [QnA Maker](http://qnamaker.ai) and integrate it into your bot and ensure the bot is providing correct answers
1. Build a [LUIS](http://luis.ai) model for RMA tickets
    * Create RMA Ticket
    * Lookup RMA Ticket
    * Format ABC-12345 or ABC12345 (case insensitive)
1. In code, create a dialog for both your QnA KB and your LUIS intent
    * RMA Dialog
        * Should capture the following
            * Product Name
            * Reason for RMA
        * Should prompt the user for any missing information
        * Should confirm the user wants to create the RMA after information has been gathered
1. Use [dispatch](https://github.com/Microsoft/botbuilder-tools/tree/master/packages/Dispatch) to determine which dialog to invoke
1. Ensure your bot is providing accurate FAQ responses, creating RMA tickets, etc
1. Deploy to a public endpoint in Azure
1. Set up a CI/CD pipleline using devops.azure.com