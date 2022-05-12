import LanguageTranslatorV3 from 'ibm-watson/language-translator/v3.js';
import ToneAnalyzerV3 from 'ibm-watson/tone-analyzer/v3.js';
import { IamAuthenticator } from 'ibm-watson/auth/index.js';

const toneAnalyzer = new ToneAnalyzerV3({
    version: '2017-09-21',
    authenticator: new IamAuthenticator({
        apikey: 'uzYhudZt4xOW91nTGCizqSAilFZ7XIB34BPCLRZpNQux',
    }),
    serviceUrl: 'https://api.us-south.tone-analyzer.watson.cloud.ibm.com/instances/d03cf30c-5bb9-45f9-b35d-f61f1d96c28a',
});

const languageTranslator = new LanguageTranslatorV3({
    version: '2018-05-01',
    authenticator: new IamAuthenticator({
      apikey: 'JyYNpF3rt3CWlzYLdwKaISuuy4cnEofbXE4-V---M3E9',
    }),
    serviceUrl: 'https://api.us-south.language-translator.watson.cloud.ibm.com/instances/864f2320-8292-4973-a69e-f62cfa7303cb',
});

export async function detect_intent_text(text) {
    const translateParams = {
        text: text,
        modelId: 'es-en',
    };

    const englishText = await languageTranslator
        .translate(translateParams)
        .then(translationResult  => {
            return translationResult.result.translations[0].translation;
        }).catch(err => {
            console.log('error:', err);
        });
    
    const toneParams = {
        toneInput: { 'text': englishText },
        contentType: 'application/json',
    };

    return await toneAnalyzer.tone(toneParams)
        .then(toneAnalysis => {
            return toneAnalysis.result ;
        })
        .catch(err => {
            console.log('error:', err);
        });
}