// importing
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./database/db');
const cors = require('cors');
const cloudinary = require('cloudinary');
var morgan = require('morgan')
var acceptMultimedia = require('connect-multiparty')

// Making express app
const app = express();
app.use(morgan('combined'))
// dotenv config
dotenv.config();

// cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// app.use(fileUpload())
app.use(acceptMultimedia())

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

app.use('/api/user', require('./routes/userRoutes'))
app.use("/api/user", require("./routes/saveRoutes"));
app.use('/api/products', require('./routes/productRoutes'))
app.use('/api/category', require('./routes/categoryRoutes'))
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/order', require('./routes/orderRoutes'));

// defining port
const PORT = process.env.PORT;
// run the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

module.exports = app;