import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import { v4 as uuid } from "uuid";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback"
    },
    async (_, __, profile, done) => {
      const email = profile.emails[0].value;
      let user = await User.findOne({ email });

      if (!user) {
        user = await User.create({ userId: uuid(), email });
      }

      done(null, user);
    }
  )
);
