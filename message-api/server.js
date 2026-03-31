const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authMiddleware = require('./middleware/auth');
const messagesRouter = require('./routes/messages');

const app = express();


app.use(cors());


app.use(express.json());

app.use(authMiddleware);

app.use('/api/messages', messagesRouter);



mongoose.connect(
  process.env.MONGODB_URI || 'mongodb://localhost:27017/messages_db'
)
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch(err => {
    console.log('MongoDB connection error:', err.message);
  });



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(` Server is running on http://localhost:${PORT}`);
});
