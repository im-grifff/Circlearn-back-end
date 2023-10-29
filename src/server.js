const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
const authSocket = require('./middleware/authSocket');

//routes
const Routes = require('./routes/route');

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cors());

//membuat koneksi dengan database mongodb, lebih jelasnya yaitu database runding_database
mongoose
  .connect(
    `mongodb+srv://grifff:griffinjr020203@cluster0.covjrne.mongodb.net/`,
    // `mongodb+srv://pokemongo090103:gUHPvXgutAyGhNp2@circlearn.nwrdsvw.mongodb.net/`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  )
  .then(() => {
    console.log('Successfully connect to MongoDB.');
  })
  .catch((err) => {
    console.error('Connection error', err);
    process.exit();
  });

//route middleware
app.use('/', Routes);
app.use('/images', express.static(path.join('src/images')));

//menjalankan server pada port 8080
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

//sockets for live chat
const io = new Server(server, {
  cors: { origin: '*' }
});

io.use(async (socket, next) => {
  const token = socket.handshake.headers.auth;
  if (await authSocket(token)) {
    next();
  } else {
    socket.disconnect();
    console.log('user disconnected');
    next(new Error('invalid'));
  }
});

io.on('connection', (socket) => {
  console.log('a user connected : ', socket.id);
  socket.on('chat_message', (msg) => {
    console.log('message: ' + msg);
    io.emit('chat_message', msg);
  });
  socket.on('disconnect', () => {
    console.log('user disconnected : ', socket.id);
  });
});

app.set('socketio', io);
