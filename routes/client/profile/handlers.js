'use strict';

var internals = {},
  _ = require('lodash');
var Crypto = require('@lib/Crypto');
const { Users } = require('@models');
const Image = require('@lib/Image');

internals.index = async function (req, reply) {
  let credentials = await Users.findOne({
    _id: req.auth.credentials._id,
  }).lean();
  return reply.view('client/profile/index.html', {
    credentials,
  });
};
internals.update = async function (req, reply) {
  let payload = {
    firstname: req.payload.firstname,
    lastname: req.payload.lastname,
    email: req.payload.email,
    phoneNumber: req.payload.phoneNumber,
    password: Crypto.encrypt(req.payload.password),
    studentId: req.payload.studentId,
    address: req.payload.address,
    course: req.payload.course,
    department: req.payload.department,
  };
  if (_.isEmpty(req.payload.password)) delete payload.password;
  const userUpdate = await Users.findOneAndUpdate(
    {
      _id: req.auth.credentials._id,
    },
    {
      $set: payload,
    }
  ).lean();
  if (!userUpdate) {
    return reply.redirect(
      '/client/profile?message=Error to udpdate&alert=error'
    );
  }
  return reply.redirect(
    '/client/profile?message=Successfully update&alert=success'
  );
};

internals.upload = async function (req, reply) {
  Image.uploadUser(req.payload.img, req.auth.credentials._id);
  await Users.update(
    { _id: req.auth.credentials._id },
    {
      $set: {
        profile_img: `/assets/images/users/${req.auth.credentials._id}.jpg`,
      },
    }
  );
  return reply.redirect(
    '/client/profile?message=Successfully update&alert=success'
  );
};
module.exports = internals;
