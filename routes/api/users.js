const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const keys = require('../../config/keys');
const passport = require('passport');

//load validation input
const validateRegsterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');

//@route GET api/users/test  @desc Tests users route  @access public
router.get('/test', (req, res) => res.json({msg: 'users works'}));

//@route   POST api/users/register @desc    Register user @access  public
router.post('/register', (req, res) => {
  const {errors, isValid} = validateRegsterInput(req.body);

  if (!isValid) {
    return res
      .status(400)
      .json(errors);
  }

  User
    .findOne({email: req.body.email})
    .then(user => {
      if (user) {
        errors.email = 'Email already exists!';

        return res
          .status(400)
          .json(errors);
      } else {
        const avatar = gravatar.url(req.body.email, {
          s: '200',
          r: 'pg',
          d: 'mm'
        });

        const newUser = new User({name: req.body.name, email: req.body.email, avatar: avatar, password: req.body.password});

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) 
              throw err;
            newUser.password = hash;
            newUser
              .save()
              .then(user => res.json(user))
              .catch(err => console.log(err));
          })
        })
      }
    })
});

// @route   GET api/users/login @desc    login user / return JWT @access  public
router.post('/login', (req, res) => {
  const {errors, isValid} = validateLoginInput(req.body);

  if (!isValid) {
    return res
      .status(400)
      .json(errors);
  }

  const email = req.body.email;
  const password = req.body.password;

  //Find the user
  User
    .findOne({email})
    .then(user => {
      //Check user
      if (!user) {
        errors.email = 'User not found';
        return res
          .status(400)
          .json(errors);
      }

      //Check password
      bcrypt
        .compare(password, user.password)
        .then(isMatch => {
          if (isMatch) {
            const payload = {
              id: user.id,
              name: user.name,
              avatar: user.avatar
            };

            jwt.sign(payload, keys.secret, {
              expiresIn: 3600
            }, (err, token) => {
              res.json({
                success: true,
                token: 'Bearer ' + token
              })
            });
          } else {
            errors.password = 'Password incorrect!';
            return res
              .status(400)
              .json(errors);
          }
        })
    });
});

// @route   GET api/users/current @desc     Return Current user @access private
router.get('/current', passport.authenticate('jwt', {session: false}), (req, res) => {
  res.json({id: req.user.id, name: req.user.name, email: req.user.email});
});

module.exports = router;