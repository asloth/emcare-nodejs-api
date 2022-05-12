import express, { response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import Cors from "cors";
import { detect_intent_text } from './routes/ibm.js.js';
import { detectIntent } from './routes/dialogflow.js.js';
import { getSentiment, setNewPsicologist,saveSentiment  } from './routes/firebase.js.js';
import { setNewUser, login } from './routes/firebase.js.js';
import { getTendency } from './routes/firebase.js.js';
import { getDataAnalysis } from './routes/firebase.js.js';
import { getAllUsers } from './routes/firebase.js.js';
import { emotionRecognition } from './routes/model.js';

const port = process.env.PORT || 3000;
const app = express();
var router = express.Router();
app.use(express.urlencoded({extended:true}));
app.use(Cors());
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.get('/api', (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.end('<h1>Web utilizada para alojar servicios de la aplicacion movil Emcare</h1>');
})

app.get('/api/user-compromise', (req, res) => {
  res.sendFile(path.resolve(__dirname, "views/user-compromise.html"));
})

app.get('/api/privacy-policy', (req, res) => {
  res.sendFile(path.resolve(__dirname, "views/privacy-policy.html"));
})
//Ruta para reconocimmiento de emociones
app.post('/api/ibm', async (req, res) => {
   let text = req.body.message;
   let response = await detect_intent_text(text);
   let nregs = await saveSentiment( req.body.userid, response);
   if (nregs > 1){
      await getTendency(req.body.userid);
   }
   res.json(response);
})
//Ruta para reconocimmiento de emociones
app.post('/api/emotion', async (req, res) => {
  let text = req.body.message;
   let response = await emotionRecognition(text);
   let nregs = await saveSentiment( req.body.userid, response);
   res.json(response);
})
//Ruta para comunicación con dialogflow
app.post('/api/dialog', async (req, res) => {
    const response = await detectIntent(req.body.message);
    res.json(response);
})
//Ruta para obtener emociones por usuario
app.post('/api/get-sentiment', async (req, res) => {
  const response = await getSentiment(req.body.userid);
  res.json(response);
})
//Ruta para agregar un usuario
app.post('/api/new-user', async (req, res) => {
  const response = await setNewUser(req.body.userid, req.body.username);
  res.json(response);
})
//Ruta para obtener la tendencia de las emociones
app.post('/api/get-analysis', async (req, res) => {
  const response = await getDataAnalysis(req.body.userid);
  res.json(response)
})
//Ruta para listar a todos los usuarios
app.post('/api/users', async (req, res) => {
  const response = await getAllUsers();
  res.json(response);
})

// Login
app.post("/api/login", async (req, res) => {
  const response = await login(req.body.username, req.body.password);
  res.json(response);
  });

  //Resgistrar un psicologo
app.post("/api/register", async (req, res) => {
  const response = await setNewPsicologist(req.body.username, req.body.password);
  res.json(response);
  });

app.listen(port, () => {
  console.log(`Servidor ejecutándose en: http://localhost:${port}`)
})