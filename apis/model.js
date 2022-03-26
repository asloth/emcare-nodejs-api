import axios from "axios";

export async function emotionRecognition(text) {

  return await axios
    .post("http://68.183.124.29/distilbert", {
      data: {
        message: text,
      },
    })
    .then((response) => {
      let res = response.data.slice(1, response.data.length-1);
      return JSON.parse(res);
    })
    .catch((error) => {
      console.log(error);
    });
}
