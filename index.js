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
const cash = {
  async getCompanies() {
    if ('companies' in this) {
      return this.companies;
    } else {
      let companies = []
      let collectionSnapshot = await db.collection('companies').get()
      collectionSnapshot.forEach(documentSnapshot => {
        companies.push({ id: documentSnapshot.id, ...documentSnapshot.data() })
      });
      this.companies = companies
      return companies
    }
  }
}
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
//validate user and set user in req
app.use(async (req, res, next) => {
  let hasError = false, errorString, user = { error: 'authenticate error' }
  if (req.cookies && req.cookies.token) {

    const client = new OAuth2Client();

    let ticket
    try {
      ticket = await client.verifyIdToken({
        idToken: req.cookies.token,
        audience: '859003465245-0e19el21rsofb768u8icerklp5o8np6r.apps.googleusercontent.com',  // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
        maxExpiry: 3600 * 24 * 300,
      })
    } catch (error) {
      hasError = true
      errorString = error.toString()
      if (errorString.indexOf('Token used too late') > -1) { // token used too late error
        let matches = errorString.match(/\{.+\}/g)

        if (matches && matches.length > 0) {
          user = JSON.parse(matches[0])
        }
      }
    }
    if (!hasError) {
      user = ticket.getPayload();
    }
  }
  if ('error' in user) {
    res.json({ user })
  } else {
    let companies = await cash.getCompanies();
    let isBoss = false
    let bossOfCompanyId
    for (company of companies) {
      if (user.sub == company.bossId) {
        isBoss = true
        bossOfCompanyId = company.id
        break
      }
    }
    user.isBoss = isBoss
    user.bossOfCompanyId = bossOfCompanyId
    req.fm_user = user
    next()
  }
})
app.get('/', async (req, res) => {


  res.sendFile(path.join(__dirname + '/views/index.html'));
})
app.get('/boss', async (req, res) => {
  let companies = cash.getCompanies();

  res.sendFile(path.join(__dirname + '/views/boss.html'))
})
function validateTokenAndGetPayload(token, req) {

}
app.post('/joinCompany', async (req, res) => {


  const userRef = db.collection('users').doc(req.fm_user.sub);

  const userRes = await userRef.update({ company: req.body.company });

  const documentSnapshot = await userRef.get();
  userJson = documentSnapshot.data();
  res.json({ user: userJson })
})
app.get('/users', async (req, res) => {
  let users = []
  //verify if current user is boss
  if (!req.fm_user.isBoss) {
    res.json({ error: 'you are not a boss of a company' })
  } else {
    // get users from db
    const usersSnapshot = await db.collection('users').where('company.name', '==', req.fm_user.bossOfCompanyId).get()
    usersSnapshot.forEach((u) => {
      users.push(u.data())
    })
    res.json(users)
  }

  // send users back
})
app.post('/setJoinCompanyStatus', async (req, res) => {
  // req.body {sub, data: {status: 1|0}}
  console.log('post /setJoinCompanyStatus req.body ', req.body)
  if (!req.fm_user.isBoss) {
    res.json({error: 'you are not boss'})

  } else {// the user, who is requesting, is boss

    const userRef = db.collection('users').doc(req.body.sub);
    let userSnapshot = await userRef.get()
    let user = userSnapshot.data()
  
    if (req.fm_user.bossOfCompanyId != user.company.name) {
      res.json({error: 'you are not the boss of the staff'})
    } else { // the user, who is requesing, is the boss of the user being updated

      await userRef.set(req.body.data, { merge: true });
      userSnapshot = await userRef.get()
      res.json({user: userSnapshot.data()})
    }
  
  }




})
app.post('/user', async (req, res) => {

  let user = req.fm_user, userJson
  let companies = await cash.getCompanies();
  let companyIds = companies.map(c => c.id)

  const userRef = db.collection('users').doc(user.sub);

  const userRes = await userRef.set(user, { merge: true });

  const documentSnapshot = await userRef.get();
  userJson = documentSnapshot.data();


  res.json({
    user: userJson,
    companies: companyIds
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