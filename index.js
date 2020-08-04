const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const webpush = require('web-push')
const app = express()
app.use(cors())
app.use(bodyParser.json())
const port = process.env.PORT || 4000;
const dummyDb = { subscription: null } //dummy in memory store

const pgOptions = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
};

const saveToDatabase = async subscription => {
  // Since this is a demo app, I am going to save this in a dummy in memory store. Do not do this in your apps.
  // Here you should be writing your db logic to save it.
  //dummyDb.subscription = subscription
}


const query = async (qu) => {

	const { Client } = require('pg')
	const client = new Client()
	await client.connect()
	const res = await client.query(qu)
	await client.end()
return res;
/*	const { Client } = require('pg');
	const db = new Client(pgOptions);
	db.connect();

	db.query(qu, (err, qres) => {
		if (err)
			throw err;
		res.body = JSON.stringify(qres.rows);
		console.log(JSON.stringify(qres.rows));
		db.end();
	});
*/
}

app.get('/', (req, res) => res.send('<h1>Hello World!</h1> ' + JSON.stringify(dummyDb)))

app.get('/sub', async (req, res) => {
	var r = await query('select * from subscriptions');
	res.body = JSON.stringify(r.rows);
});


// The new /save-subscription endpoint
app.post('/save-subscription', async (req, res) => {
  const subscription = req.body
  await saveToDatabase(subscription) //Method to save the subscription to Database
  res.json({ message: 'success' })
})

const vapidKeys = {
  publicKey:
    'BOTPzboE4C_uWvQyJfZb2wmGiZ353PfPPmiaht_krkseJMAoAOxnH-2ohIyC1om_bgUoNgNyqK6Q6ICk1KmgnI8',
  privateKey: 'JoYZJO-0akJLwdWB6-D1sbJ5rzbejsCWQ6bXEHRgdhA',
}
//setting our previously generated VAPID keys
webpush.setVapidDetails(
  'mailto:myuserid@email.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
)

//function to send the notification to the subscribed device
const sendNotification = (subscription, dataToSend) => {
  webpush.sendNotification(subscription, dataToSend)
}
//route to test send notification
app.get('/send-notification', (req, res) => {
  const subscription = dummyDb.subscription //get subscription from your databse here.
  const message = 'Hello World'
  sendNotification(subscription, message)
  res.json({ message: 'message sent' })
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))