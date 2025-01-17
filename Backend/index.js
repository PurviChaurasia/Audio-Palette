require('dotenv').config()
const express = require("express");
const { connected } = require('process');
const querystring = require("querystring");
const app = express();
const axios = require('axios');
const port = 8888;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

app.get('/', (req, res) => {
  res.send("hi");
});

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 * generateRandomString() utility function is used to generate a random string for the 
 * state query param and cookie. The state query param is kind of a security measure — 
 * it protects against attacks such as cross-site request forgery.
 */
const generateRandomString = length => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};


const stateKey = 'spotify_auth_state';

app.get('/login', (req, res) => {

  const state = generateRandomString(16);
  res.cookie(stateKey, state);

  const scope = 'user-read-private user-read-email user-top-read';

  const queryParams = querystring.stringify({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    state: state,
    scope: scope
  })
  res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
});

app.get('/callback', (req, res) => {
  /* The code variable is set to the authorization code returned from the Spotify API if it exists, otherwise it is set to null. */
  const code = req.query.code || null;

  axios({
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    data: querystring.stringify({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI
    }),
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${new Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
  })
    .then(response => {
      if (response.status == 200) {
        const { access_token, token_type } = response.data;
        const axios = require('axios');
        const filesystem = require('fs');

        axios.get('https://api.spotify.com/v1/me/', {
          headers: {
            Authorization: `${token_type} ${access_token}`
          }
        })
          .then(response => {
            res.write(`<pre>${JSON.stringify(response.data, null, 2)}</pre>`);
            // rescurl -o file.JSON response.data
            filesystem.writeFileSync('Frontend/src/Components/userDetails.json', JSON.stringify(response.data), function (err) {
              console.log(err);
            })
          })
          .catch(error => {
            console.log(error);
          });

        axios.get('https://api.spotify.com/v1/me/top/artists', {
          headers: {
            Authorization: `${token_type} ${access_token}`
          }
        })
          .then(response => {
            res.write(`<pre>${JSON.stringify(response.data, null, 2)}</pre>`);
            filesystem.writeFileSync('Frontend/src/Components/artistDetails.json', JSON.stringify(response.data), function (err) {
              console.log(err);
            })
          })
          .catch(error => {
            console.log(error);
          });

        axios.get('https://api.spotify.com/v1/me/top/tracks', {
          headers: {
            Authorization: `${token_type} ${access_token}`
          }
        })
          .then(response => {
            res.write(`<pre>${JSON.stringify(response.data, null, 2)}</pre>`);
            filesystem.writeFileSync('Frontend/src/Components/trackDetails.json', JSON.stringify(response.data), function (err) {
              console.log(err);
            })
            res.end();
          })
          .catch(error => {
            console.log(error);
          });

      } else {
        res.send(response);
      }

    })
    .catch(error => {
      console.log(error);
    });
});

app.get('/refresh_token', (req, res) => {
  const { refresh_token } = req.query;

  axios({
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    data: querystring.stringify({
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    }),
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${new Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
  })
    .then(response => {
      res.send(response.data);
    })
    .catch(error => {
      res.send(error);
    });
});

app.listen(port, () => {
  console.log("Express is listening at 8888");
})
