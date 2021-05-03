import admin from 'firebase-admin';
import serviceAccount from '../emcare-firebase-admin.json';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore(); 

export async function saveSentiment(userId, sentiment){
    let dateNow = new Date();
    
    const id_doc = dateNow.getDate() + '-' + dateNow.getMonth() + '-' + dateNow.getFullYear() + ',' + dateNow.getHours() + ':' + dateNow.getMinutes() + ':' + dateNow.getSeconds() + ':' + dateNow.getMilliseconds();
    
    const userInfo = await db.collection('users').doc(userId).collection('sentiments').doc(id_doc).set({
        date: dateNow,
        sentiment: sentiment,
    });
    

}