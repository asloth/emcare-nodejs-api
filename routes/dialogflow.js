// Imports the Dialogflow library
import dialogflow from '@google-cloud/dialogflow';
const serviceAccount = require("../df-service.json");

// Instantiates a session client
const sessionClient = new dialogflow.SessionsClient({
    credentials: serviceAccount,
});

export async function detectIntent(query) {

    const projectId = 'emcare-99162';
    const sessionId = '123456789';
    
    // The path to identify the agent that owns the created intent.
    const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

    // The text query request.
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: query,
                languageCode: 'es-ES',
            },
        },
    };

    const responses = await sessionClient.detectIntent(request);
    const responseMessages = responses[0].queryResult.fulfillmentMessages;
    responseMessages[0].intentDisplayName = responses[0].queryResult.intent.displayName;
    console.log(responseMessages )
    //console.log(responses[0].queryResult.intent.displayName )

    return responseMessages;
}