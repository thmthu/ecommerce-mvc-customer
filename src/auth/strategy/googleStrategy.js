"use strict";
const customerModel = require("../../models/customer.model");
const FederatedCredentials = require("../../models/federatedCredentials.model");
var GoogleStrategy = require("passport-google-oauth2").Strategy;
const { ObjectId } = require("mongodb");
require("dotenv").config();
const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.DOMAIN}/auth/google/callback`,
    passReqToCallback: true,
    proxy: true,
    prompt: "select_account",
  },
  async function (request, accessToken, refreshToken, profile, done) {
    try {
      console.log("creae profile");
      let federatedCredential = await FederatedCredentials.findOne({
        provider: "google",
        subject: profile.id,
      });
      if (!federatedCredential) {
        var newUser = await customerModel.findOne({
          name: profile.displayName,
          email: profile.emails[0].value,
          password: "123456",
        });
        if (!newUser) {
          newUser = await customerModel.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            password: "123456",
          });
        }
        await FederatedCredentials.create({
          provider: "google",
          subject: profile.id,
          userId: newUser._id,
        });
        return done(null, newUser);
      } else {
        const user = await customerModel.findOne({
          _id: new ObjectId(federatedCredential.userId),
        });
        return done(null, user);
      }
    } catch (err) {
      return done(err);
    }
  }
);
module.exports = { googleStrategy };
