require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// ✅ CONNECT TO MONGODB (FIXED)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// ✅ USER MODEL
const User = mongoose.model('User', {
  email: String,
  password: String,
  balance: { type: Number, default: 1000 },
  frozen: { type: Boolean, default: false }
});

// ✅ REGISTER
app.post('/register', async (req, res) => {
  try {
    const hash = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({
      email: req.body.email,
      password: hash
    });
    res.send(user);
  } catch (err) {
    res.status(500).send("Error registering user");
  }
});

// ✅ LOGIN
app.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.send("User not found");

    const valid = await bcrypt.compare(req.body.password, user.password);
    if (!valid) return res.send("Wrong password");

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.send({ token, userId: user._id });
  } catch (err) {
    res.status(500).send("Login error");
  }
});

// ✅ TRANSFER (basic)
app.post('/transfer', async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);

    if (!user) return res.send("User not found");
    if (user.frozen) return res.send("Account Frozen");

    if (user.balance < req.body.amount)
      return res.send("Insufficient funds");

    user.balance -= req.body.amount;
    await user.save();

    res.send(user);
  } catch (err) {
    res.status(500).send("Transfer error");
  }
});

// ✅ FREEZE ACCOUNT
app.post('/freeze', async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);

    if (!user) return res.send("User not found");

    user.frozen = !user.frozen;
    await user.save();

    res.send(user);
  } catch (err) {
    res.status(500).send("Freeze error");
  }
});

// ✅ PORT FIX (IMPORTANT FOR RAILWAY)
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
