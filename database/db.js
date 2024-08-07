const mongoose = require('mongoose');

//connect to database
const connectToDB = () => {
    mongoose.connect(process.env.DB_URL).then(() => {
        console.log('Connected to Database');
    })
}

module.exports = connectToDB;