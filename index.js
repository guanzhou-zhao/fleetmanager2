const express = require('express')
const helmet = require("helmet");
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const multer = require('multer') // v1.0.5
const upload = multer() // for parsing multipart/form-data
const Firestore = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');
const path = require('path');
const db = new Firestore({ projectId: 'fleetmanager-406701' })

var app = express();
app.set('trust proxy', true);
const helmetOpts = {
  contentSecurityPolicy: {
    directives: {
      "connect-src": ["'self'", "https://accounts.google.com/gsi/"],
      "script-src": ["'self'", "'unsafe-inline'", "https://accounts.google.com/gsi/client", "https://localhost:8443/script.js", "https://unpkg.com/axios@1.6.7/dist/axios.min.js", "https://unpkg.com/react@18/", "https://unpkg.com/react-dom@18/"],
      "style-src": ["'self'", "'unsafe-inline'", "https://accounts.google.com/gsi/style", "https://use.fontawesome.com/releases/v5.8.2/css/all.css", "https://fonts.googleapis.com/css2"],
      "img-src": ["'self'", "https://lh3.googleusercontent.com"],
      "base-uri": ["https://accounts.google.com/gsi/", "https://localhost:8443/"],
      "script-src-attr": ["'unsafe-inline'"],
      "default-src": ["https://accounts.google.com/gsi/"]
    },
  },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
}
app.use(
  helmet(helmetOpts),
)
app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(cookieParser())


app.use(express.static('public'))

app.get('/', async (req, res) => {


  res.sendFile(path.join(__dirname + '/views/index.html'));
})
function validateTokenAndGetPayload(token, req) {

}
app.post('/joinCompany', async (req, res) => {

  
  console.log('POST /user req.body', req.body)
  const userRef = db.collection('users').doc(req.body.sub);

  const userRes = await userRef.update({company: req.body.company});
  console.log('user updated in fireStore:', userRes)

  const documentSnapshot = await userRef.get();
  userJson = documentSnapshot.data();
  console.log('user updated', userJson)
  res.json({user:userJson})
})
app.post('/user', async (req, res) => {
  console.log('POST /user req.body', req.body)
  let payload, userJson

  if (req.body && req.body.token) {

    const client = new OAuth2Client();

    let hasError = false, errorString, ticket
    try {
      ticket = await client.verifyIdToken({
        idToken: req.body.token,
        audience: '859003465245-0e19el21rsofb768u8icerklp5o8np6r.apps.googleusercontent.com',  // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
        maxExpiry: 3600 * 24 * 300,
      })
    } catch (error) {
      console.log(typeof error, '--', error.toString())
      hasError = true
      errorString = error.toString()
      if (errorString.indexOf('Token used too late') > -1) { // token used too late error
        let matches = errorString.match(/\{.+\}/g)

        if (matches && matches.length > 0) {
          payload = JSON.parse(matches[0])
          console.log('payload:', payload)
        }
      } else { // other error indicates invalid token
        payload = { error: 'authenticate error' }
      }
    }
    if (!hasError) {
      payload = ticket.getPayload();
      // If the request specified a Google Workspace domain:
      // const domain = payload['hd'];        
    }
    console.log('token payload:', payload)
  } else {
    // no token in cookie
    console.log('no token in req.body')
  }
  if (payload && 'sub' in payload) {


    const userRef = db.collection('users').doc(payload.sub);

    const userRes = await userRef.set(payload, { merge: true });
    console.log('user updated in fireStore:', userRes)

    const documentSnapshot = await userRef.get();
    userJson = documentSnapshot.data();
  }

  let companies = []
  let collectionSnapshot = await db.collection('companies').get()
  collectionSnapshot.forEach(documentSnapshot => {
    console.log(`Document found at path: ${documentSnapshot.ref.path}`);
    companies.push(documentSnapshot.id)
  });
  console.log('companies', companies);

  res.json({
    user: userJson || payload,
    companies
  })
})

const PORT = process.env.PORT || 8443
if (process.env.PORT) {
  app.listen(process.env.PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
  });
} else {
  const fs = require('fs');
  // const http = require('http');
  const https = require('https');
  const privateKey = fs.readFileSync('./sslcert/selfsigned.key', 'utf8');
  const certificate = fs.readFileSync('./sslcert/selfsigned.crt', 'utf8');

  const credentials = { key: privateKey, cert: certificate };
  const httpsServer = https.createServer(credentials, app);
  httpsServer.listen(PORT, () => {
    console.log(`https Server listening on port ${PORT}...`);
  });
}