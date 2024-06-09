const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
// const { initBD } = require('./db');
const app = express();
const port = process.env.PORT || 3001;

dotenv.config();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('pages'));
app.use('/css', express.static(__dirname + '/css'));
app.use('/js', express.static(__dirname + '/js'));

// Importing routes
const userRoutes = require('./routes/userRoutes');
const accountRoutes = require('./routes/accountRoutes');

app.use('/api', userRoutes);
app.use('/api', accountRoutes);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
