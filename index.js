// importing
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./database/db');
const cors = require('cors');
var morgan = require('morgan')
// Making express app
const app = express();
app.use(morgan('combined'))
// dotenv config
dotenv.config();



// cors config to accept request from frontend
const corsOptions = {
    origin: true,
    credentials: true,
    optionSuccessStatus: 200
};
app.use(cors(corsOptions))
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

// mongodb connection
connectDB();

// Accepting json data
app.use(express.json());

// creating test route
app.get("/test", (req, res) => {
    res.status(200).json("Hello from server");
})


// defining port
const PORT = process.env.PORT;
// run the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

module.exports = app;