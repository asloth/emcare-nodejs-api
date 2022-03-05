import axios from "axios";

export async function emotionRecognition(text) {
  return await axios
    .post("http://68.183.124.29/distilbert", {
      data: {
        message: text,
      },
    })
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.log(error);
    });
}
