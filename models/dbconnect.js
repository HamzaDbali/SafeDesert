
const mongoose = require('mongoose');

// for connection local : mongoose.connect('mongodb://localhost:27017/yaploud')
mongoose.connect('mongodb+srv://saharauser:saharauser123@cluster0.hf26jws.mongodb.net/')
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((err) => {
    console.error('Database not connected: ' + err);
  });

module.exports = mongoose;
