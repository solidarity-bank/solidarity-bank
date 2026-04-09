require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect("mongodb://127.0.0.1:27017/bank");

const User = mongoose.model('User',{
  email:String,
  password:String,
  balance:{type:Number, default:1000},
  frozen:{type:Boolean, default:false}
});

// REGISTER
app.post('/register', async(req,res)=>{
  const hash = await bcrypt.hash(req.body.password,10);
  const user = await User.create({email:req.body.email,password:hash});
  res.send(user);
});

// LOGIN
app.post('/login', async(req,res)=>{
  const user = await User.findOne({email:req.body.email});
  if(!user) return res.send("User not found");

  const valid = await bcrypt.compare(req.body.password,user.password);
  if(!valid) return res.send("Wrong password");

  const token = jwt.sign({id:user._id},"SECRET");
  res.send({token, userId:user._id});
});

// TRANSFER
app.post('/transfer', async(req,res)=>{
  const user = await User.findById(req.body.userId);
  if(user.frozen) return res.send("Account Frozen");

  user.balance -= req.body.amount;
  await user.save();

  res.send(user);
});

// FREEZE ACCOUNT
app.post('/freeze', async(req,res)=>{
  const user = await User.findById(req.body.userId);
  user.frozen = !user.frozen;
  await user.save();
  res.send(user);
});

app.listen(3001, ()=>console.log("Server running on 3001"));
