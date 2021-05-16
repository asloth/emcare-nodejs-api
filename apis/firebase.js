import admin from 'firebase-admin';
import serviceAccount from '../emcare-firebase-admin.json';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore(); 

export async function saveSentiment(userId, sentiment){
    let dateNow = new Date();
    const sentimentDate = dateNow.today();
    const id_doc = dateNow.getDate() + '-' + dateNow.getMonth() + '-' + dateNow.getFullYear() + ',' + dateNow.getHours() + ':' + dateNow.getMinutes() + ':' + dateNow.getSeconds() + ':' + dateNow.getMilliseconds();
    
    const userInfo = await db.collection('users').doc(userId).collection('sentiments').doc(id_doc).set({
        date: dateNow,
        sentiment: sentiment,
    });
    

}

export async function getTodaySentiment(userid){
    let dateNow = new Date();
    const today = dateNow.getDate() + '-' + dateNow.getMonth() + '-' + dateNow.getFullYear();
    let todayFeelings = [];
    await db.collection('users').doc(userid).collection("sentiments")
            .get()
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    // doc.data() is never undefined for query doc snapshots
                    if ( doc.id.includes(today)){
                        todayFeelings.push(doc.data());
                    }
                });
            })
            .catch((error) => {
                console.log("Error getting documents: ", error);
            });

    return await todayFeelings;
}