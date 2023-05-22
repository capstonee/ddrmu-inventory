'use strict';

var internals = {};
const { last, isNil } = require('lodash');
const _ = require('lodash');
const Crypto = require('@lib/Crypto');
const crypto = require('crypto');
const { Users, Settings, Links } = require('@models');
const Nodemailer = require('nodemailer');
const config = require('@config');
const transporter = Nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'jeza.oyao28@gmail.com',
    pass: 'gvvqfjnszfoubkaj',
  },
});

const resetPassword = (email, userID) => {
  const payload = {};
  payload.code = crypto.randomBytes(40).toString('hex');
  payload.userID = userID;

  const code = new Links(payload);
  code.save(function (err, user) {
    if (err) {
      console.log(err);
    } else {
      var mailOptions = {
        from: `"DDRMU" ${'jeza.oyao28@gmail.com'}`,
        to: email,
        subject: 'Password Reset',
        text:
          'Click this link to reset your password ' +
          `http://localhost:${config.hapi.port}/account-recovery/${payload.code}`,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log('MAIL-ERROR', error);
          return {
            success: false,
          };
        } else {
          console.log('Email sent: ' + info.response);
          return {
            success: true,
          };
        }
      });
    }
  });
};

internals.index = async function (req, reply) {
  if (req.auth.isAuthenticated) {
    if (req.auth.credentials.scope[0] === 'agent') {
      return reply.redirect('/agent/dashboard');
    } else if (req.auth.credentials.scope[0] === 'manager') {
      return reply.redirect('/manager/dashboard');
    }
  } else {
    if (isNil(req.query?.email) === false) {
      const validEmail = await Users.findOne({ email: req.query.email }).lean();
      if (!validEmail)
        return reply.redirect('/?message=Invalid email&alert=error');
      else {
        resetPassword(req.query.email, validEmail._id);
        return reply.redirect(
          `/?message=Link successfully sent to ${req.query.email}&alert=success`
        );
      }
    }

    return reply.view('accounts/login.html', {
      message: req.query.message,
      alert: req.query.alert,
    });
  }
};

internals.login = async function (req, reply) {
  req.cookieAuth.clear();
  if (isNil(req.query?.email) === false) {
    const validEmail = await Users.findOne({ email: req.query.email }).lean();
    if (!validEmail)
      return reply.redirect('/?message=Invalid email&alert=error');
    else {
      resetPassword(req.query.email, validEmail._id);
      return reply.redirect(
        `/?message=Link successfully sent to ${req.query.email}&alert=success`
      );
    }
  }

  return reply.view('accounts/login.html', {
    email: req.query.email,
    message: req.query.message,
    alert: req.query.alert,
  });
};

internals.logout = function (req, reply) {
  req.cookieAuth.clear();
  return reply.redirect('/login');
};

internals.web_authentication = async function (req, reply) {
  let credentials = await Users.findOne({
    $and: [
      { email: req.payload.email },
      { password: Crypto.encrypt(req.payload.password) },
    ],
  }).lean();

  if (!credentials) {
    return reply.redirect(
      `/login?message=Invalid email or password!&alert=error`
    );
  }
  const settings = await Settings.findOne({}).lean();
  credentials.position = credentials.scope[0];
  credentials.company_name = settings.name;
  credentials.type = settings.type;
  req.cookieAuth.set(credentials);
  return reply.redirect(`/${credentials.scope[0]}/dashboard`);
};

internals.password_reset = async (req, reply) => {
  try {
    const { user, password } = req.payload;
    const encrypted = Crypto.encrypt(password);

    await Users.findByIdAndUpdate(user, { $set: { password: encrypted } });
    return reply.redirect(
      '/?message=Password successfully reset&alert=success'
    );
  } catch (error) {
    console.log('RESSEET', error);
  }
};

internals.account_recovery = async (req, reply) => {
  try {
    const { code } = req.params;
    const validCode = await Links.findOne({ code }).lean();

    if (validCode) {
      await Links.findOneAndRemove({ code });
    }

    return reply.view('accounts/account-recovery.html', {
      validCode: validCode ? true : false,
      user: validCode?.userID || null,
      message: req.query.message,
      alert: req.query.alert,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = internals;
