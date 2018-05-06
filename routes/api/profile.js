const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

//Load Validation
const validateProfileInput = require('../../validation/profile');
const validateExperienceInput = require('../../validation/experience');

//Load profile and user model
const Profile = require('../../models/Profile');
const User = require('../../models/User');

//@route GET api/profile/test   @desc Tests profile route  @access  public
router.get('/test', (req, res) => res.json({msg: 'profile works'}));

//@route GET api/profile   @desc Get current user profile  @access private
router.get('/', passport.authenticate('jwt', {session: false}), (req, res) => {
  const errors = {};

  Profile
    .findOne({user: req.user.id})
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user';
        return res
          .status(404)
          .json(errors);
      }
      res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});

/// @route GET api/profile/all  @desc Get all profiles  @access public
router.get('/all', (req, res) => {
  const errors = {};

  Profile
    .find()
    .populate('user', ['name', 'avatar'])
    .then(profiles => {
      if (!profiles) {
        errors.noprofile = 'There are no profiles';
        res
          .status(404)
          .json(errors);
      }

      res.json(profiles);
    })
    .catch(err => res.status(404).json({profile: 'There are no profiles'}))
})

// @route GET api/profile/handle/:handle  @desc Get profile by handle  @access
// public
router.get('/handle/:handle', (req, res) => {
  const errors = {};

  Profile
    .findOne({handle: req.params.handle})
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user';
        res
          .status(404)
          .json(errors);
      }

      res.json(profile);
    })
    .catch(err => res.status(404).json(err))
});

// @route GET api/profile/user/:user_id  @desc Get profile by id  @access public
router.get('/user/:user_id', (req, res) => {
  const errors = {};

  Profile
    .findOne({user: req.params.user_id})
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user';
        res
          .status(404)
          .json(errors);
      }

      res.json(profile);
    })
    .catch(err => res.status(404).json({profile: 'There is no profile for this user'}))
});

// @route POST api/profile   @desc Get create or edit user profile  @access
// private
router.post('/', passport.authenticate('jwt', {session: false}), (req, res) => {
  const {errors, isValid} = validateProfileInput(req.body);

  //Check validation
  if (!isValid) {
    return res
      .status(400)
      .json(errors);
  }

  const profileFields = {};
  profileFields.user = req.user.id;
  if (req.body.handle) 
    profileFields.handle = req.body.handle;
  if (req.body.company) 
    profileFields.company = req.body.company;
  if (req.body.website) 
    profileFields.website = req.body.website;
  if (req.body.location) 
    profileFields.location = req.body.location;
  if (req.body.bio) 
    profileFields.bio = req.body.bio;
  if (req.body.status) 
    profileFields.status = req.body.status;
  if (req.body.githubusername) 
    profileFields.githubusername = req.body.githubusername;
  
  if (req.body.skills !== 'undefined') {
    profileFields.skills = req
      .body
      .skills
      .split(',');
  }

  profileFields.social = {};
  if (req.body.youtube) 
    profileFields.social.youtube = req.body.youtube;
  if (req.body.twitter) 
    profileFields.social.twitter = req.body.twitter;
  if (req.body.facebook) 
    profileFields.social.facebook = req.body.facebook;
  if (req.body.instagram) 
    profileFields.social.instagram = req.body.instagram;
  if (req.body.linkedin) 
    profileFields.social.linkedin = req.body.linkedin;
  
  Profile
    .findOne({user: req.user.id})
    .then(profile => {
      if (profile) {
        //update
        Profile.findOneAndUpdate({
          user: req.user.id
        }, {
          $set: profileFields
        }, {new: true}).then(profile => res.json(profile))
      } else {
        //create
        Profile
          .findOne({handle: profileFields.handle})
          .then(profile => {
            if (profile) {
              errors.handle = 'That handle already exists'
              res
                .status(400)
                .json(errors);
            }

            new Profile(profileFields)
              .save()
              .then(profile => res.json(profile));
          })
      }
    })

});

// @route POST api/profile/experience  @desc add experience  @access private
router.post('/experience', passport.authenticate('jwt', {session: false}), (req, res) => {
  const {errors, isValid} = validateExperienceInput(req.body);

  //Check validation
  if (!isValid) {
    return res
      .status(400)
      .json(errors);
  }

  Profile
    .findOne({user: req.body.id})
    .then(profile => {
      const newExp = {
        title: req.body.title,
        company: req.body.company,
        location: req.body.location,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description
      }
      
      //add to experience array
      profile.experience.unshift(newExp);

      profile.save().then(profile => res.json(profile));
    })
});

module.exports = router;