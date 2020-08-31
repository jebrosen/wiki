/* global WIKI */

// ------------------------------------
// ORCiD Account
// ------------------------------------

const OrcidStrategy = require('passport-orcid').Strategy
const _ = require('lodash')

module.exports = {
  init(passport, conf) {
    passport.use('orcid',
      new OrcidStrategy({
        // sandbox: process.env.NODE_ENV !== 'production',
        sandbox: false,
        clientID: conf.clientId,
        clientSecret: conf.clientSecret,
        callbackURL: conf.callbackURL,
        passReqToCallback: true,
      }, async (req, accessToken, refreshToken, params, profile, cb) => {
        try {
          const user = await WIKI.models.users.processProfile({
            profile: {
              email: "not-really-an-email-" + params.orcid + "@fake.com",
              displayName: params.name,
              ...profile,
            },
            providerKey: req.params.strategy,
          })
          cb(null, user)
        } catch (err) {
          cb(err, null)
        }
      })
    )
  }
}
