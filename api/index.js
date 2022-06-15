import express, { response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import Cors from "cors";
import { detect_intent_text } from '../routes/ibm.js';
import { detectIntent } from '../routes/dialogflow.js';
import { getSentiment, setNewPsicologist,saveSentiment, getUser } from '../routes/firebase.js';
import { setNewUser, login } from '../routes/firebase.js';
import { getTendency, updateUser } from '../routes/firebase.js';
import { getDataAnalysis, updatePassword } from '../routes/firebase.js';
import { getAllUsers, getAllAdmins, updateStatePsicologist, deletePsicologist } from '../routes/firebase.js';
import { emotionRecognition } from '../routes/model.js';

const port = process.env.PORT || 3000;
const app = express();
var router = express.Router();
app.use(express.urlencoded({extended:true}));
app.use(Cors());
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.get('/', (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.end('<h1>Web utilizada para alojar servicios de la aplicacion movil Emcare</h1>');
})

app.get('/user-compromise', (req, res) => {
  res.sendFile(path.resolve(__dirname, "views/user-compromise.html"));
})

app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.resolve(__dirname, "views/privacy-policy.html"));
})
//Ruta para reconocimmiento de emociones
app.post('/ibm', async (req, res) => {
   let text = req.body.message;
   let response = await detect_intent_text(text);
   let nregs = await saveSentiment( req.body.userid, response);
   if (nregs > 1){
      await getTendency(req.body.userid);
   }
   res.json(response);
})
//Ruta para reconocimmiento de emociones
app.post('/emotion', async (req, res) => {
  let text = req.body.message;
   let response = await emotionRecognition(text);
   let nregs = await saveSentiment( req.body.userid, response);
   res.json(response);
})
//Ruta para comunicación con dialogflow
app.post('/dialog', async (req, res) => {
    const response = await detectIntent(req.body.message);
    res.json(response);
})
//Ruta para obtener emociones por usuario
app.post('/get-sentiment', async (req, res) => {
  const response = await getSentiment(req.body.userid);
  res.json(response);
})
//Ruta para agregar un usuario
app.post('/new-user', async (req, res) => {
  const response = await setNewUser(req.body.userid, req.body.username);
  res.json(response);
})
//Ruta para obtener la tendencia de las emociones
app.post('/get-analysis', async (req, res) => {
  const response = await getDataAnalysis(req.body.userid);
  res.json(response)
})
//Ruta para listar a todos los usuarios
app.post('/users', async (req, res) => {
  const response = await getAllUsers();
  res.json(response);
})

// Login for admin web
app.post("/login", async (req, res) => {
  const response = await login(req.body.username, req.body.password);
  res.json(response);
  });

//Registrar un psicologo
app.post("/register", async (req, res) => {
  const response = await setNewPsicologist(req.body.username, req.body.password);
  res.json(response);
});
//Devuelve el nombre de un usuario movil
app.post("/get-user", async (req, res) => {
  const response = await getUser(req.body.userid);
  res.json(response);
});
//Actualiza el nombre de un usuario
app.post("/update-user", async (req, res) => {
  const response = await updateUser(req.body.userid, req.body.newname);
  res.json(response);
});
//Elimina a un psicologo
app.post("/delete-admin", async (req, res) => {
  const response = await deletePsicologist(req.body.username);
  res.json(response);
});

//cambia la contraseña de un psicologo
app.post("/update-password", async (req, res) => {
  const response = await updatePassword(req.body.username,req.body.password );
  res.json(response);
});

//cambia el estado de la cuenta de un psicologo
app.post("/update-state", async (req, res) => {
  const response = await updateStatePsicologist(req.body.username,req.body.newstate);
  res.json(response);
});
//Devuelve todos los administradores
app.post('/admins', async (req, res) => {
  const response = await getAllAdmins();
  res.json(response);
})

export default app;