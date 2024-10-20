const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb+srv://ares:aman8900@ares.mswempk.mongodb.net/expense').then(() => {
	console.log('Connected to MongoDB');
}).catch(err => {
	console.error('Failed to connect to MongoDB', err);
});

// Define User schema and model
const userSchema = new mongoose.Schema({
	username: { type: String, unique: true, required: true },
	password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

const expenseSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	name: { type: String, required: true },
	amount: { type: Number, required: true },
	category: { type: String, required: true },
	date: { type: String, required: true }
});
const Expense = mongoose.model('Expense', expenseSchema);

// Set up session middleware with MongoDB store
app.use(session({
	secret: 'expenseTrackerSecret',
	resave: false,
	saveUninitialized: true,
	store: MongoStore.create({ mongoUrl: 'mongodb+srv://ares:aman8900@ares.mswempk.mongodb.net/expense' }),
	cookie: { secure: false } // Set to true if using HTTPS
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Route to show the login page
app.get('/login', (_, res) => {
	res.render('login', { error: null });
});

// Route to handle login submissions
app.post('/login', async (req, res) => {
	const { username, password } = req.body;
	const user = await User.findOne({ username, password });

	if (user) {
		req.session.loggedInUser = user.username;
		res.redirect('/');
	} else {
		res.render('login', { error: 'Invalid credentials. Please try again.' });
	}
});

// Route to show the signup page
app.get('/signup', (_, res) => {
	res.render('signup', { error: null });
});

// Route to handle signup submissions
app.post('/signup', async (req, res) => {
	const { username, password } = req.body;

	try {
		const user = new User({ username, password });
		await user.save();
		res.redirect('/login');
	} catch (err) {
		if (err.code === 11000) { // Duplicate username error
			res.render('signup', { error: 'Username already exists! Please choose another one.' });
		} else {
			res.render('signup', { error: 'An error occurred. Please try again.' });
		}
	}
});

// Route to handle logout
app.get('/logout', (req, res) => {
	req.session.destroy(err => {
		if (err) {
			return res.redirect('/');
		}
		res.clearCookie('connect.sid'); // Ensure the session cookie is cleared
		res.redirect('/login');
	});
});

// Route for the home/index page
app.get('/', (_, res) => {
	res.render('index');
});

// Route for the calculate page (access restricted to logged-in users)
app.get('/calculate', (req, res) => {
	const loggedInUser = req.session.loggedInUser;
	if (loggedInUser) {
		res.render('calculate');
	} else {
		res.redirect('/login');
	}
});

// Expenses API Working below

app.get('/expenses', async (req, res) => {
	const loggedInUser = req.session.loggedInUser;
	if (!loggedInUser) {
		return res.status(401).json({ error: 'Unauthorized' });
	}

	const user = await User.findOne({ username: loggedInUser });
	const expenses = await Expense.find({ userId: user._id });
	res.json(expenses);
});

app.post('/expenses', async (req, res) => {
	const loggedInUser = req.session.loggedInUser;
	if (!loggedInUser) {
		return res.status(401).json({ error: 'Unauthorized' });
	}

	const user = await User.findOne({ username: loggedInUser });
	const { name, amount, category, date } = req.body;

	const expense = new Expense({
		userId: user._id,
		name,
		amount,
		category,
		date
	});

	await expense.save();
	res.json(expense);
});

app.delete('/expenses/:id', async (req, res) => {
	const loggedInUser = req.session.loggedInUser;
	if (!loggedInUser) {
		return res.status(401).json({ error: 'Unauthorized' });
	}

	const user = await User.findOne({ username: loggedInUser });
	const expenseId = req.params.id;

	const result = await Expense.deleteOne({ _id: expenseId, userId: user._id });
	if (result.deletedCount === 0) {
		return res.status(404).json({ error: 'Expense not found' });
	}

	res.json({ success: true });
});

app.put('/expenses/:id', async (req, res) => {
	const loggedInUser = req.session.loggedInUser;
	if (!loggedInUser) {
		return res.status(401).json({ error: 'Unauthorized' });
	}

	const user = await User.findOne({ username: loggedInUser });
	const expenseId = req.params.id;
	const updatedExpense = req.body;

	const result = await Expense.updateOne({ _id: expenseId, userId: user._id }, updatedExpense);
	if (result.matchedCount === 0) {
		return res.status(404).json({ error: 'Expense not found' });
	}

	const expense = await Expense.findOne({ _id: expenseId, userId: user._id });
	res.json(expense);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
