function onClick(event){
  const button = event.currentTarget;
  const vis = button.parentNode.dataset.vis;
  hide();
  makeRequest(vis);
}

function makeRequest(vis){
  //fa partire la fetch per le api di youtube
  const playlist_request = PLAYLIST_ENDPOINT + '?part=snippet&playlistId=' + PLAYLIST_LIST[vis] + '&key=' + YOUTUBE_API_KEY;
  fetch(playlist_request, yt_options).then(onResponse).then(YTProcess);

  //fa partire la fetch per le api di imgur
  const image_request = IMAGE_ENDPOINT + '/' + ALBUM_LIST[vis] + '/images';
  const imgOptions = {
    method: 'GET',
    headers: {
      "Authorization": "Bearer " +  accesstoken
    },
    redirect: 'follow'
  };
  fetch(image_request, imgOptions).then(onResponse).then(onImage);
}

function onResponse(response){
  return response.json();
}

function YTProcess(json){
  console.log("Richiedo YouTube Playlist Video");
  //Recupera gli id dei video di quella specifica playlist
  const elements = json.items;
  const video_id = [];
  for(const elem in elements){
  video_id.push(elements[elem].snippet.resourceId.videoId);
  }
  getSrc(video_id);
}

function getSrc(video_id){
  //recupera tramite fetch informazioni sul video (tramite l'id), in modo da ottenere la src del video
  console.log("Genero iframe");
  for(const elem of video_id){
    const request = VIDEOS_ENDPOINT + '?part=player&id=' + elem + "&key=" + YOUTUBE_API_KEY;
    fetch(request, yt_options).then(onResponse).then(generate);
  }
}

function generate(json){
  //recuperiamo del json il campo embedHtml
  const embedHtml = json.items[0].player['embedHtml'];

  //embedHtml ha altri campi che non ci servono, estraiamo solo il campo src
  const div = document.createElement('div');
  div.innerHTML = embedHtml;
  const elem = div.querySelector('iframe');
  const src = elem.getAttribute('src');
  div.remove();

  //modifichiamo la src, che di default non ha il protocollo ma inizia con "//www.youtube.com ecc"
  const https_src = "https:" + src;

  //creiamo ora il nostro iframe personalizzato
  const iframe = document.createElement('iframe');
  iframe.classList.add("video");
  iframe.setAttribute('src', https_src);
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('allow', 'encrypted-media; gyroscope; picture-in-picture');
  iframe.setAttribute('allowfullscreen', '');

  //aggiungiamo l'iframe al contenitore per i video
  const video_container = document.getElementById("video-container");
  video_container.appendChild(iframe);
}

function onImage(json){
  //estraiamo dal json solo il campo data, che è un array
  console.log("Stampo immagini");
  const dati = json.data;
  console.log(json.data);

  //scansioniamo l'array
  for(const elem of dati){
    const wrap = document.createElement('div');
    const img = document.createElement('img');
    const desc = document.createElement('div');
    wrap.classList.add("wrap");
    img.classList.add("imgur");
    desc.classList.add("img-desc");
    img.addEventListener('click', onImageClick);

    //estraiamo il link dell'immagine
    img.src = elem.link;
    //estraiamo anche la descrizione
    desc.innerHTML = elem.description;

    //inseriamo immagine e descrizione dentro il wrap (che sarebbe il suo contenitore)
    wrap.appendChild(img);
    wrap.appendChild(desc);
    //poi aggiungiamo il wrap al contenitore delle immagini
    const image_container = document.getElementById("image-container");
    image_container.appendChild(wrap);
  }
}

function hide(){
    //nasconde tutti gli articoli
    const visuals = document.getElementById("visuals");
    visuals.classList.add("hidden");

    //mostra invece la sezione di richiesta dinamica da api
    const contents = document.getElementById("contents");
    contents.classList.remove("hidden");
}

function show(){
    //mostra tutti gli articoli
    const visuals = document.getElementById("visuals");
    visuals.classList.remove("hidden");

    //nasconde invece la sezione di richiesta dinamica da api
    const contents = document.getElementById("contents");
    contents.classList.add("hidden");
}

function onBack(event){
    //pulisce tutto il nuovo html creato
    const video_container = document.getElementById("video-container");
    video_container.innerHTML = '';
    const image_container = document.getElementById("image-container");
    image_container.innerHTML = '';
    //mostra gli article
    show();
}

function onToken(json)
{
  console.log("Risposta ricevuta:");
  console.log(json);
  accesstoken = json.access_token;
  console.log("Ecco il token");
  console.log(accesstoken);
}

function onImageClick(event){
  const image = document.createElement('img');
  image.src = event.currentTarget.src;
  document.body.classList.add('no-scroll');
  modalView.style.top = window.pageYOffset + 'px';
  modalView.appendChild(image);
  modalView.classList.remove('hidden');
}

function onModalClick() {
  document.body.classList.remove('no-scroll');
  modalView.classList.add('hidden');
  modalView.innerHTML = '';
}

/*
MAIN EXECUTION
*/

/*IMGUR DATA*/
//Imgur, all'atto della registrazione al developer portal, oltre a fornire client id e cllient secret i
//fornisce anche un token detto refresh token, da passare insieme agli altri parametri per ottenere un token
//di accesso valido per autenticare le altre richieste agli endpoint
const client_id = "f719b6fdb9e5504";
const client_secret = "f7ae9fd376ea363d190ffd9e392cf1c7754cc5c9";
const refresh_token = "2e5cfaa67da8e75ef7e8aca4a77c0e30003beeac";
const grant_type = "refresh_token";
const AUTH_ENDPOINT = "https://api.imgur.com/oauth2/token";
const IMAGE_ENDPOINT = "https://api.imgur.com/3/album"

let accesstoken;

const ALBUM_LIST = {capture: "tLdAB4O", ma3d: "2V4AndW", magicvis: "BzmwDNh"};

/*YOUTUBE DATA*/
const YOUTUBE_API_KEY = "AIzaSyC605lq8vMrRGsJ7x_19qCAEySIaizbEm4";
const PLAYLIST_ENDPOINT = "https://youtube.googleapis.com/youtube/v3/playlistItems";
const VIDEOS_ENDPOINT = "https://youtube.googleapis.com/youtube/v3/videos";

const PLAYLIST_LIST = {capture: "PLPyD1ylvBYvRvIeN-L77OHbGRYKorp9Fx", ma3d: "PLZLeBfQxWvf7vPbKTxH3qF4_3pjgfCsD3", magicvis: "PL6ifvrHDlqMHreOBDmnpYxgELIiiEzSbc"};

const yt_options = {
  method: 'GET',
  headers: {
    Accept: 'application/json',
  }
}

//Otteniamo da Imgur il token che useremo per il resto delle richieste
//Questa specifica api vuole che tutti i parametri del body siano passati come stringa, e che il body non sia un oggetto
//Prepariamo quindi la stringa di richiesta in formato standard url
const request = "refresh_token=" + refresh_token + '&client_id=' + client_id + '&client_secret=' + client_secret + '&grant_type=' + grant_type;

const tokenOptions = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: request,
  redirect: 'follow'
};

//facciamo la fetch del token
console.log("Richiedo token");
fetch(AUTH_ENDPOINT, tokenOptions).then(response => onResponse(response)).then(json => onToken(json)).catch(error => console.log('error', error));

//Aggiungiamo gli event listener ai bottoni "scopri di più"
const button_list = document.querySelectorAll(".content span");
for(const elem of button_list){
    elem.addEventListener('click', onClick);
}

//aggiungiamo il listener al tasto "torna indietro"
const back = document.getElementById("back");
back.addEventListener('click', onBack);

const modalView = document.querySelector('#modal-view');
modalView.addEventListener('click', onModalClick);