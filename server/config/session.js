const session = require('express-session');
const MongoStore = require('connect-mongo');

const sessionConfig = session({
  secret: process.env.SESSION_SECRET || 'secret_dev',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 14 * 24 * 60 * 60, // 14 jours
    autoRemove: 'native'
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 14, // 14 jours
    sameSite: 'lax'
  }
});

module.exports = sessionConfig;
