'use strict';
require('dotenv').config();
require('module-alias/register');

const { Sales } = require('@models');
const _ = require('lodash');

var HapiServer = require('./src/config/hapi');

require('./src/database/mongodb');

HapiServer.start(function () {
  console.log('Server is running at : ' + HapiServer.info.uri);
});

//TWIILION CREDENTIALS ACCOUNT
var accountSid = 'ACf7b66259984b42088d6066a50fa2e864'; // Your Account SID from www.twilio.com/console
var authToken = 'be8f6e76633232028e4a69a3b82c36ca'; // Your Auth Token from www.twilio.com/console
const twilio = require('twilio')(accountSid, authToken);

setInterval(async () => {
  // console.log('find items need to be return');
  const sales = await findSalesToSendMessage();
  if (!_.isEmpty(sales)) {
    sales.map(async (r) => {
      if (!_.isNil(r.user_id.phoneNumber)) {
        await sendMessage(r.user_id);
        await updateSalesIntoSentMessage(r);
      }
    });
  }
}, 1000); // SEND MESSAGE EVERY 24 HOURS

//FIND ITEM NEED TO BE RETURN
const findSalesToSendMessage = async () => {
  let end = new Date();
  end.setDate(end.getDate() + 1);

  const sales = await Sales.find({
    returnDate: { $lt: end },
    status: 'accepted',
    isSent: false,
    isReturn: true,
  })
    .populate('user_id')
    .lean();
  return sales;
};

//UPDATE ITEM HAS BEEN SENT MESSAGE
const updateSalesIntoSentMessage = async (sales) => {
  await Sales.updateOne({ _id: sales._id }, { $set: { isSent: true } });
};

//SEND MESSAGE
const sendMessage = (user) => {
  twilio.messages
    .create({
      from: '+16206225276',
      to: '+639936520418',
      body: 'Please return our item',
    })
    .then((res) => {
      console.log('sent to ', user.phoneNumber);
    })
    .catch((err) => {
      console.log(err);
    });
};
