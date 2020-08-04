const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const webpush = require('web-push')
const app = express()
app.use(cors())
app.use(bodyParser.json())
const port = process.env.PORT || 4000;
const dummyDb = { subscription: null } //dummy in memory store

webpush.setVapidDetails(
  'mailto:myuserid@email.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

const Sequelize = require('sequelize')
const sequelize = new Sequelize(process.env.DATABASE_URL);
sequelize.authenticate()
.then(() => {
	console.log('Connection has been established successfully.');
})
.catch(err => {
	console.error('Unable to connect to the database:', err);
});
const Subscription = sequelize.define('subscription', {
	// attributes
	user: {
		type: Sequelize.STRING,
		//allowNull: false
	},
	raw: {
		type: Sequelize.STRING
	}
}, {
	// options
});

// Note: using `force: true` will drop the table if it already exists
Subscription.sync({ force: true }); // Now the `users` table in the database corresponds to the model definition

app.post('/subscribe', async (req, res) => {
	try {
		const newSub = new Subscription({raw:req.body});
		await newSub.save();
		res.json({ subscription: newSub }) // Returns the new user that is created in the database
	} catch(error) {
		console.error(error)
	}
});

app.get('/subscription', async (req, res) => {
	try {
		const sub = await Subscription.findAll();
		res.json({ sub });
	} catch(error) {
		console.error(error);
	}
});

app.get('/subscription/:subId', async (req, res) => {
	const subId = req.params.subId;
	try {
		const sub = await Subscription.findAll({where: { id: subId }});
		res.json({ sub });
	} catch(error) {
		console.error(error);
	}
});

const saveToDatabase = async subscription => {
  // Since this is a demo app, I am going to save this in a dummy in memory store. Do not do this in your apps.
  // Here you should be writing your db logic to save it.
  //dummyDb.subscription = subscription
}

app.get('/', (req, res) => res.send('<h1>Hello World!</h1> ' + JSON.stringify(dummyDb)))

app.get('/sub', async (req, res) => {
});

// The new /save-subscription endpoint
app.post('/save-subscription', async (req, res) => {
  const subscription = req.body
  await saveToDatabase(subscription) //Method to save the subscription to Database
  res.json({ message: 'success' })
})

//const vapidKeys = {
//  publicKey:	process.env.VAPID_PUBLIC_KEY, 		// e.g. 'BOTPzboE4C_uWvQyJfZb2wmGiZ353PfPPmiaht_krkseJMAoAOxnH-2ohIyC1om_bgUoNgNyqK6Q6ICk1KmgnI8',
//  privateKey:	process.env.VAPID_PRIVATE_KEY		// e.g. 'JoYZJO-0akJLwdWB6-D1sbJ5rzbejsCWQ6bXEHRgdhA',
//}

//function to send the notification to the subscribed device
const sendNotification = (subscription, dataToSend) => {
  webpush.sendNotification(subscription, dataToSend)
}
//route to test send notification
app.get('/notify', (req, res) => {

	const subs = await Subscription.findAll();
	subs.forEach(s=>webpush.sendNotification(s, req.body));


//  const subscription = dummyDb.subscription //get subscription from your databse here.
//  const message = 'Hello World'
//  sendNotification(subscription, message)
  res.json({ message: 'message sent' })
})
app.get('/notify/:subId', (req, res) => {

	const subs = await Subscription.findAll({where: { id: subId }});
	subs.forEach(s=>webpush.sendNotification(s, req.body));


//  const subscription = dummyDb.subscription //get subscription from your databse here.
//  const message = 'Hello World'
//  sendNotification(subscription, message)
  res.json({ message: 'message sent' })
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))