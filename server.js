require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./src/app');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(3000, () => {
      console.log("Server running on port 3000");
    });
  })
  .catch((err) => console.log("MongoDB connection error:", err));
