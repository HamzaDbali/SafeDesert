
const mongoose = require('mongoose');

// for connection local : mongoose.connect('mongodb://localhost:27017/yaploud')
<<<<<<< HEAD
mongoose.connect('mongodb+srv://saharauser:saharauser123@cluster0.hf26jws.mongodb.net/')
=======
mongoose.connect('mongodb+srv://saharausersaharauser123@cluster0.hf26jws.mongodb.net/')
>>>>>>> fdc970617d0b0d9f6ee0831ebc1fc2497feaa1d8
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((err) => {
    console.error('Database not connected: ' + err);
  });

module.exports = mongoose;
