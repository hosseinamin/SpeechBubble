'use strict';

var User = require('./user.model');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var nodemailer = require('nodemailer');
var htmlToText = require('html-to-text');
var path = require('path');
var jade = require('jade');
var request = require('request');
const {handleError,intFromQuery} = require('../apiutil');

var validationError = function(res, err) {
  return res.json(422, err);
};

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function(req, res) {
  var page = intFromQuery(req.query.page, 1);
  var limit = intFromQuery(req.query.limit, 10);
  var skip = (page - 1) * limit;
  var re = new RegExp(req.query.term, 'i');
  var query = [
    { email: re },
    { firstName: re },
    { lastName: re }
  ];

  User
  .find()
  .or(query)
  .count(function(err, total) {
    if(err) { return handleError(res, err); }
    User.find()
    .or(query)
    .sort({ email: 'asc' })
    .skip(skip)
    .limit(limit)
    .then((users) => {
      return res.json(200, {
        total: total,
        items: users
      });
    })
    .catch(handleError.bind(this, res));
  });
};

/**
 * Creates a new user
 */
exports.create = function (req, res, next) {
  var userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  var newUser = new User(req.body);
  newUser.provider = 'local';
  newUser.role = 'user';

  var captchaUrl = 'https://www.google.com/recaptcha/api/siteverify?secret=' + process.env.CAPTCHA_API_KEY + '&response=' + req.body.captcha + '&remoteip=' + userIp;

  request({ url: captchaUrl, json: true }, function(captchaErr, captchaRes, captchaBody) {

      if(true) {
        newUser.save(function(err, user) {
          if (err) return validationError(res, err);

          var token = jwt.sign({_id: user._id }, config.secrets.session, { expiresInMinutes: 60*5 });
          res.json({ token: token });

          // nodemailer transport
          var transporter = nodemailer.createTransport({
              service: process.env.EMAIL_SERVICE,
              auth: {
                 user: process.env.EMAIL_EMAILADDRESS,
                 pass: process.env.EMAIL_EMAILPASSWORD
            }
           });

          var htmlStr = jade.renderFile(path.resolve(__dirname, 'emails/welcome.jade'), {
                user: user,
                activationUrl: process.env.DOMAIN + '/account/activate/' + user.activationCode,
                domain: process.env.DOMAIN
              });

          var mailOptions = {
              from: '"SpeechBubble" <' + process.env.SUPPORT_EMAIL +'>',
              to: '"' + user.firstName + '" <'+ user.email +'>',
              subject: 'Welcome to SpeechBubble',
              text: htmlToText.fromString(htmlStr),
              html: htmlStr
          };
          transporter.sendMail(mailOptions, function(error, info){
              if(error){
                  res.send(400, error);
              }
              res.send(200);
          });

        });
      } else {
        return res.send(422, 'Re-captcha error, please verify again.');
      }

    }
  );

};

/**
 * Get a single user
 */
exports.show = function (req, res, next) {
  var userId = req.params.id;

  User.findById(userId, function (err, user) {
    if (err) return next(err);
    if (!user) return res.send(401);
    res.json(user.profile);
  });
};

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function(req, res) {
  User.findByIdAndRemove(req.params.id, function(err, user) {
    if(err) return res.send(500, err);
    return res.send(204);
  });
};

/**
 * Change a users password
 */
exports.changePassword = function(req, res, next) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  User.findById(userId, function (err, user) {
    if(!user.hashedPassword || user.authenticate(oldPass)) {
      user.password = newPass;
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.send(200);
      });
    } else {
      res.send(403);
    }
  });
};

/**
 * Get my info
 */
exports.me = function(req, res, next) {
  User
    .findOne({ '_id': req.user._id})
    .populate('recentlyViewed')
    .populate('recentDrafts')
    .select('-salt -hashedPassword') // don't ever give out the password or salt
    .then((user) => {
      if (err) return next(err);
      if (!user) return res.json(401);
      var data = user.toJSON();
      data.disqus = user.disqus;
      res.json(data);
    })
    .catch(handleError.bind(this, res));
};

/**
 * Update my info
 */
exports.update = function(req, res, next) {
  var userId = req.user._id;
  User.findOneAndUpdate({
    _id: userId
  }, {
    email: req.body.email,
    firstName: req.body.firstName,
    lastName: req.body.lastName || '',
    description: req.body.description || '',
    region: req.body.region || '',
    subscribe: req.body.subscribe
  }, function(err) {
    if (err) return validationError(res, err);
    res.send(200);
  });
};

/**
 * Admin update user info
 * restriction: 'admin'
 */
exports.adminUpdate = function(req, res, next) {
  User.findOneAndUpdate({
    _id: req.params.id
  }, {
    email: req.body.email,
    role: req.body.role,
    active: req.body.active,
    subscribe: req.body.subscribe
  }, function(err) {
    if (err) return validationError(res, err);
    res.send(200);
  });
};

/**
 * Authentication callback
 */
exports.authCallback = function(req, res, next) {
  res.redirect('/');
};

/**
 * Email verification
 */
exports.activate = function(req, res, next) {
  User.findOneAndUpdate({
    activationCode: req.params.id
  }, { active: true }, function(err, user) {
    if (err) return next(err);
    if (!user) return res.send(400);
    res.send(200);
  });
};
