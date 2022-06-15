import admin from 'firebase-admin';
//import serviceAccount from "../emcare-firebase-admin.json";
//import serviceAccount from "../emcare-firebase-admin.json" assert { type: "json" };
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require("../emcare-firebase-admin.json");
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'emcare-99162.appspot.com'
});

const auth = admin.auth()
const db = admin.firestore(); 
const bucket = admin.storage().bucket();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function saveSentiment(userId, sentiment){
    let dateNow = new Date();
    
    const id_doc = dateNow.getDate() + '-' + dateNow.getMonth() + '-' + dateNow.getFullYear() + ',' + dateNow.getHours() + ':' + dateNow.getMinutes() + ':' + dateNow.getSeconds() + ':' + dateNow.getMilliseconds();
    
    const userInfo = await db.collection('users').doc(userId).collection('sentiments').doc(id_doc).set({
        date: dateNow,
        sentiment: sentiment,
    });

    const regs = await db.collection('users').doc(userId).collection("sentiments").get() ;
    
    return regs.size ;
}

export async function getTendency(userid){

    let data = [];
    await db.collection('users').doc(userid).collection("sentiments")
            .get()
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    // doc.data() is never undefined for query doc snapshots
                    data.push(doc.data());
                });
            })
            .catch((error) => {
                console.log("Error getting documents: ", error);
            });
            let base64Image;
            let publicUrl;
            let slope, asymmetry, variation;
            axios
              .post(
                "https://tone-analyzer-spanish-api.herokuapp.com/analysis",
                {
                  data: data,
                }
              )
              .then((res) => {
                console.log(res.data.pendiente);
                base64Image = res.data.image;
                slope = res.data.pendiente;
                asymmetry = res.data.asimetria;
                variation = res.data.variacion;
                fs.writeFile(
                  "image.png",
                  base64Image,
                  { encoding: "base64" },
                  function (err) {
                    console.log("File created");
                    console.log(err);
                  }
                );
                const uuidv4 = v4();
                bucket.upload(
                  path.resolve(__dirname, "../image.png"),
                  {
                    destination: userid + ".png",
                    metadata: {
                      metadata: {
                        firebaseStorageDownloadTokens: uuidv4,
                      },
                    },
                  },
                  function (err, file) {
                    file.makePublic();
                    publicUrl = file.publicUrl();
                    db.collection("users").doc(userid).set(
                      {
                        analysis_url: publicUrl,
                        slope: slope,
                        asymmetry: asymmetry,
                        variation: variation,
                      },
                      { merge: true }
                    );
                  }
                );
              })
              .catch((error) => {
                console.error(error);
              });
 
}

export async function getSentiment(userid){
    let dateNow = new Date();
    const today = dateNow.getDate() + '-' + dateNow.getMonth() + '-' + dateNow.getFullYear();
    let todayFeelings = [];
    let userFeelings = [];
    let response = [];
    await db.collection('users').doc(userid).collection("sentiments")
            .get()
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    // doc.data() is never undefined for query doc snapshots
                    if ( doc.id.includes(today)){
                        todayFeelings.push(doc.data());
                    }
                    userFeelings.push(doc.data());

                });
            })
            .catch((error) => {
                console.log("Error getting documents: ", error);
            });
             response.push(todayFeelings);
             response.push(userFeelings);
    return response;
}

export async function getUser(userId) {
  const userdata = await db.collection('users').doc(userId).get();
  return userdata.data() ;
}

export async function updateUser(userId, newname){
  const oldUser = await db.collection('users').doc(userId)
  return await oldUser.update({
   name: newname,
 });
}

export async function setNewUser(userId, userName){
    const userDb = await db.collection('users').doc(userId); 
    return await userDb.set({
        name: userName,
        uid: userId
    })
}

export async function getAllFeelings(userid){
    let userFeelings = [];
    await db.collection('users').doc(userid).collection("sentiments")
            .get()
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    // doc.data() is never undefined for query doc snapshots
                    userFeelings.push(doc.data());
                });
            })
            .catch((error) => {
                console.log("Error getting documents: ", error);
            });
}

export async function getDataAnalysis (userid){
    let dataAnalysis = {};
    await db.collection('users').doc(userid)
            .get()
            .then((documentSnapshot) => {
                dataAnalysis.slope =  documentSnapshot.get('slope');
                dataAnalysis.asymmetry = documentSnapshot.get('asymmetry');
                dataAnalysis.variation = documentSnapshot.get('variation');
                dataAnalysis.analysis_url = documentSnapshot.get('analysis_url');
                dataAnalysis.username = documentSnapshot.get('name');
                
            })
            .catch((error) => {
                console.log("Error getting documents: ", error);
            });
            return dataAnalysis;
            
}

export async function getAllUsers(){
    let userdocs = [];
    await db.collection('users').get().then((documentSnapshot) => {
      documentSnapshot.forEach((doc) => {
        userdocs.push(doc.data());
      });
    }).catch((error) => {
      console.log("Error getting documents: ", error);
    });
    return userdocs;// get collection
}

export async function setNewPsicologist(username, password ){
  if (!(password && username)) {
    return {
      "error": "Complete todos los campos por favor."
    };
  }
  
  const oldUser = await db.collection('psicologists').doc(username).get();
  
  if (oldUser.exists) {
    return {
      "error": "Usuario ya existe. Por favor inicie sesión"
    };
  }

  let encryptedPassword = await bcrypt.hash(password, 10);

  return await db.collection('psicologists').doc(username).set({
    name: username,
    password: encryptedPassword,
  }) ;
  
}

export async function updatePassword(username, password){
  //verificamos que los datos no esten vacios
  if (!(password && username)) {
    return {
      "error": "Complete todos los campos por favor."
    };
  }
  //encriptamos la contraseña
  let encryptedPassword = await bcrypt.hash(password, 10);
  //obtenemos el usuario
  const oldUser = await db.collection('psicologists').doc(username)
  
  //varificamos que exista
  if (!(await oldUser.get()).exists){
    console.log('entre')
    console.log((await oldUser.get()).exists)
    return {
      "error": "Administrador no encontrado"
    };
  }
  //actualizamos la contraseña
  return await oldUser.update({
   password: encryptedPassword,
 });

}

export async function updateStatePsicologist(username, newState){
  const oldUser = await db.collection('psicologists').doc(username)
  //varificamos que exista
  if (!oldUser.exists){
    return {
      "error": "Usuario no encontrado"
    };
  }
  //actualizamos la contraseña
  return await oldUser.update({
   state: newState,
 });
}

export async function deletePsicologist(username){
  const oldUser = await db.collection('psicologists').doc(username)
  //varificamos que exista
  if (!oldUser.exists){
    return {
      "error": "Usuario no encontrado"
    };
  }

  return oldUser.delete(); 
}

export async function login(username, password){

  //verificamos que los inputs esten llenos
  if (!(password && username)) {
    return {
      "error": "Complete todos los campos por favor."
    };
  }
  
  //verificamos que el user exista
  const user = await db.collection('psicologists').doc(username).get();
  
  if (!user.exists){
    return {
      "error": "Usuario no encontrado"
    };
  }
  //verificamos que sea un usuario activo
  if (!user.get('state')){
    return {
      "error": "Usuario desactivado. No puede ingresar."
    };
  }
  
  //comparamos las contraseñas para ver si coinciden
  if (! await bcrypt.compare(password, user.get('password'))){
    return {
      "error": "Contraseña incorrecta"
    };
  }
  //obtenemos el token
  const token = jwt.sign({
    username: user.username
  }, "secretito", {
    expiresIn: "72h",
  });

  //devolvemos el token e indicamos si es administrador o no
  return {
    "token": token,
    "admin": user.get('admin'),
  }
}

export async function getAllAdmins(){
  let userdocs = [];
  await db.collection('psicologists').get().then((documentSnapshot) => {
    documentSnapshot.forEach((doc) => {
      userdocs.push(doc.data());
    });
  }).catch((error) => {
    console.log("Error getting documents: ", error);
  });
  return userdocs;// get collection
}