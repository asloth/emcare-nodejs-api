import express, { response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import Cors from "cors";
import { detect_intent_text } from './apis/ibm.js';
import { detectIntent } from './apis/dialogflow.js';
import { saveSentiment } from './apis/firebase.js';
import { getSentiment } from './apis/firebase.js';
import { setNewUser } from './apis/firebase.js';
import { getTendency } from './apis/firebase.js';
import { getDataAnalysis } from './apis/firebase.js';

const port = process.env.PORT || 3000;
const app = express();
app.use(express.urlencoded({extended:true}));
app.use(Cors());
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.get('/', (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.end('<h1>Web utilizada para alojar servicios de la aplicación móvil Emcare</h1>');
})

app.get('/user-compromise', (req, res) => {
  res.sendFile(path.resolve(__dirname, "views/user-compromise.html"));
})

app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.resolve(__dirname, "views/privacy-policy.html"));
})

app.post('/ibm', async (req, res) => {
   let text = req.body.message;
   let response = await detect_intent_text(text);
   let nregs = await saveSentiment( req.body.userid, response);
   if (nregs > 1){
      await getTendency(req.body.userid);
   }
   res.json(response);
})

app.post('/dialog', async (req, res) => {
    const response = await detectIntent(req.body.message);
    res.json(response);
})

app.post('/get-sentiment', async (req, res) => {
  const response = await getSentiment(req.body.userid);
  res.json(response);
})

app.post('/new-user', async (req, res) => {
  const response = await setNewUser(req.body.userid, req.body.username);
  res.json(response);
})

app.post('/get-analysis', async (req, res) => {
  const response = await getDataAnalysis(req.body.userid);
  console.log(response);
  res.json(response)
})

app.listen(port, () => {
  console.log(`Servidor ejecutándose en: http://localhost:${port}`)
})