'use strict';

var _ = require('lodash');
var Supplier = require('./supplier.model');
const {handleError,intFromQuery} = require('../apiutil');

// Get list of suppliers
exports.index = function(req, res) {
  var page = intFromQuery(req.query.page, 1);
  var limit = intFromQuery(req.query.limit, 10);
  var skip = (page - 1) * limit;
  var re = new RegExp(req.query.term, 'i');
  var query = [
    { name: re }
  ];

  Supplier
  .find()
  .or(query)
  .count(function(err, total) {
    if(err) { return handleError(res, err); }
    Supplier.find()
    .or(query)
    .sort({ name: 'asc' })
    .skip(skip)
    .limit(limit)
    .then((suppliers) => {
      return res.json(200, {
        total: total,
        items: suppliers
      });
    })
    .catch(handleError.bind(this, res));
  });
};

// Get a single supplier
exports.show = function(req, res) {
  Supplier.findById(req.params.id, function (err, supplier) {
    if(err) { return handleError(res, err); }
    if(!supplier) { return res.send(404); }
    return res.json(supplier);
  });
};

// Creates a new supplier in the DB.
exports.create = function(req, res) {
  Supplier.create(req.body, function(err, supplier) {
    if(err) { return handleError(res, err); }
    return res.json(201, supplier);
  });
};

// Updates an existing supplier in the DB.
exports.update = function(req, res) {
  console.log(req.body);
  if(req.body._id) { delete req.body._id; }
  Supplier.findByIdAndUpdate(req.params.id, {
    $set: {
      name: req.body.name,
      url: req.body.url,
      supportDetails: req.body.supportDetails || '',
      locations: req.body.locations
    }
  }, function (err, supplier) {
    console.log(err);
    if (err) { return handleError(res, err); }
    if(!supplier) { return res.send(404); }
    return res.json(200, supplier);
  });
};

// Deletes a supplier from the DB.
exports.destroy = function(req, res) {
  Supplier.findById(req.params.id, function (err, supplier) {
    if(err) { return handleError(res, err); }
    if(!supplier) { return res.send(404); }
    supplier.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};
