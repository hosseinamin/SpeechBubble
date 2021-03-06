'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var Page = require('./page.model');
var User = require('../user/user.model');
var jade = require('jade');
var nodemailer = require('nodemailer');
var htmlToText = require('html-to-text');
var path = require('path');
const {handleError} = require('../apiutil');

exports.show = function(req, res) {
  Page
  .findOne({
    slug: req.params.slug,
    visible: true
  })
  .lean()
  .then((page) => {
    if(!page) { return res.send(404); }
    res.send(200, page);
  })
  .catch(handleError.bind(this, res));
};

// Publishes a page revision
exports.publish = function(req, res) {
  var pageId = req.params.id;
  var revisionId = req.params.revision;

  Page
  .findById(pageId)
  .then((page) => {
    if (!page) {
      return res.send(404);
    }
    var revision = page.revisions.id(revisionId);

    if (!revision) {
      return res.send(404);
    }

    var newPageData = _.omit(revision.toObject(), ['_id', 'createdAt', 'updatedAt']);

    page = _.extend(page, newPageData, { currentRevision: revisionId, visible: true });

    page.save(function(err, numberAffected, raw) {
      if (err) {
        return handleError(res, err);
      }

      // nodemailer transport
      var transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
           user: process.env.EMAIL_EMAILADDRESS,
           pass: process.env.EMAIL_EMAILPASSWORD
        }
      });

      var htmlStr = jade.renderFile(path.resolve(__dirname, 'emails/revision-published.jade'), {
            url: process.env.DOMAIN + '/' + page.slug,
            revision: revisionId
          });

      var mailOptions = {
          from: '"SpeechBubble Admin" <no-reply@speechbubble.org.uk>',
          to: '"SpeechBubble Admin"' + '<'+ process.env.SUPPORT_EMAIL +'>',
          subject: 'New Page Revision Published',
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
  })
  .catch((err) => {
    handleError(res, err);
  });
};

exports.create = function(req, res) {
  Page.create({ slug: req.body.slug, note: req.body.note }, function(err, page) {
    if(err) { return handleError(res, err); }
    return res.send(200, page);
  });
};

// Adds a new revision to a page.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }

  Page.findById(req.params.id, function(err, page) {
    if (err) { return handleError(res, err); }
    if(!page) { return res.send(404); }

    page.revisions.push({
      title: req.body.title,
      content: req.body.content,
      slug: req.body.slug,
      comments: req.body.comments,
      note: req.body.note,
      author: req.user._id
    });

    page.save(function(err, product) {
      if (err) {
        return handleError(res, err);
      }

      // nodemailer transport
      var transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
           user: process.env.EMAIL_EMAILADDRESS,
           pass: process.env.EMAIL_EMAILPASSWORD
        }
      });

      var htmlStr = jade.renderFile(path.resolve(__dirname, 'emails/revision-published.jade'), {
            url: process.env.DOMAIN + '/' + page.slug,
            revision: revisionId
          });

      var mailOptions = {
          from: '"SpeechBubble Admin" <no-reply@speechbubble.org.uk>',
          to: '"SpeechBubble Admin"' + '<'+ process.env.SUPPORT_EMAIL +'>',
          subject: 'New Page Revision',
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
  });
};

exports.list = function(req, res) {
  Page
  .find()
  .sort({ slug: 'asc' })
  .then((pages) => {
    res.send(200, pages);
  })
  .catch(handleError.bind(this, res));
};

exports.destroy = function(req, res) {
  Page.findById(req.params.id, function(err, page) {
    if(err) { return handleError(res, err); }
    if(!page) { return res.send(404); }
    page.remove(function(err) {
      if (err) {
        return handleError(res, err);
      }
      return res.send(204);
    });
  });
};

// Get page revisions
exports.revisions = function(req, res) {
  Page
    .findById(req.params.id)
    .lean()
    .then((page) => {
      if (!page) {
        return res.send(404);
      }
      Page.populate(page, {
        path: 'revisions.author',
        select: 'firstName lastName',
        model: 'User'
      }, function(err, page) {
        if (err) {
          return handleError(res, err);
        }
        return res.send(200, page.revisions);
      });
    })
    .catch(handleError.bind(this, res));
};

