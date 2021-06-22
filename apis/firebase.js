import admin from 'firebase-admin';
import serviceAccount from '../emcare-firebase-admin.json';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 } from 'uuid';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'emcare-99162.appspot.com'
});

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
                .post('https://tone-analyzer-spanish-api.herokuapp.com/analysis', {
                data: data
                })
                .then(res => {
                    console.log(res.data.pendiente)
                    base64Image = res.data.image;
                    slope = res.data.pendiente;
                    asymmetry = res.data.asimetria;
                    variation = res.data.variacion;
                    fs.writeFile('image.png', base64Image, {encoding: 'base64'}, function(err) {
                        console.log('File created');
                        console.log(err);
                    });
                    const uuidv4 = v4();
                    bucket.upload(path.resolve(__dirname,'../image.png'),  {
                        destination: userid+'.png',
                        metadata: {
                            metadata: {
                                firebaseStorageDownloadTokens: uuidv4,
                            }
                        },
                      }, function (err, file){
                        file.makePublic();
                        publicUrl = file.publicUrl();
                        db.collection('users').doc(userid).set({
                            analysis_url: publicUrl,
                            slope: slope,
                            asymmetry: asymmetry,
                            variation: variation,
                        }, {merge:true});
                      });  
                })
                .catch(error => {
                    console.error(error)
                })
 
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
    return await response;
}

export async function setNewUser(userId, userName){
    const userDb = await db.collection('users').doc(userId); 
    return await userDb.set({
        name: userName,
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