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
const User = sequelize.define('user', {
	// attributes
	firstName: {
		type: Sequelize.STRING,
		allowNull: false
	},
	lastName: {
		type: Sequelize.STRING
		// allowNull defaults to true
	}
}, {
	// options
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
User.sync({ force: true }); // Now the `users` table in the database corresponds to the model definition

app.post('/user', async (req, res) => {
	try {
		const newUser = new User(req.body)
		await newUser.save()
		res.json({ user: newUser }) // Returns the new user that is created in the database
	} catch(error) {
		console.error(error)
	}
})

app.get('/user', async (req, res) => {
	try {
		const user = await User.findAll()
		res.json({ user })
	} catch(error) {
		console.error(error)
	}
})

app.get('/user/:userId', async (req, res) => {
	const userId = req.params.userId;
	try {
		const user = await User.findAll({where: { id: userId }});
		res.json({ user });
	} catch(error) {
		console.error(error);
	}
})

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
app.get('/send-notification', (req, res) => {
  const subscription = dummyDb.subscription //get subscription from your databse here.
  const message = 'Hello World'
  sendNotification(subscription, message)
  res.json({ message: 'message sent' })
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))