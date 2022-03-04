import axios from "axios";
import { response } from "express";

export async function emotionRecognition(text) {
  let rs;
  await axios
    .post("http://68.183.124.29/distilbert", {
      data: {
        message: text,
      },
    })
    .then(function (response) {
      rs = response.data;
    })
    .catch(function (error) {
      console.log(error);
    });
  return rs;
}
