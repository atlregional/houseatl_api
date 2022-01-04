require('dotenv').config();

const express = require('express'),
	morgan = require('morgan'),
	compression = require('compression'),
	mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3001;
const routes = require('./routes');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan('tiny'));
app.use(compression());

// https://house-atl-api-dev.herokuapp.com/

app.use((req, res, next) => {
	res.append('Access-Control-Allow-Origin', ['*']);
	res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	res.append('Access-Control-Allow-Headers', 'Content-Type');
	next();
});

app.use(routes);

mongoose
	.connect(process.env.MONGODB_URI || 'mongodb://localhost/houseatl', {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.catch(err => console.log(err));

app.listen(PORT, () => {
	console.log(`🌎  ==> API Server now listening on PORT ${PORT}!`);
});
