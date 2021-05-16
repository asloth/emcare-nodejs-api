import express from 'express';
import { detect_intent_text } from './apis/ibm.js';
import { detectIntent } from './apis/dialogflow.js';
import { saveSentiment } from './apis/firebase.js';
import { getTodaySentiment } from './apis/firebase.js';

const port = process.env.PORT || 3000;
const app = express();
app.use(express.urlencoded({extended:true}));

app.get('/', (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.end('<h1>Hello World</h1>');
})

app.post('/ibm', async (req, res) => {
   let text = req.body.message;
   let response = await detect_intent_text(text);
   saveSentiment( req.body.userid, response);
   res.json(response);
})

app.post('/dialog', async (req, res) => {
    const response = await detectIntent(req.body.message);
    res.json(response);
})

app.post('/get-sentiment', async (req, res) => {
  const response = await getTodaySentiment(req.body.userid);
  res.json(response);
})

app.listen(port, () => {
  console.log(`Servidor ejecutándose en: http://localhost:${port}`)
})