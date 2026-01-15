import utils from "@strapi/utils";
const { sanitize } = utils;

const sanitizeUser = (user: any, ctx: any) => {
  const { auth } = ctx.state;
  const userSchema = strapi.getModel("plugin::users-permissions.user");
  return sanitize.contentAPI.output(user, userSchema, { auth });
};

export default (plugin: any) => {
  // Override the JWT callback to include userType in the token
  plugin.services.jwt.issue = (payload: any, jwtOptions = {}) => {
    const secret = strapi.config.get("plugin.users-permissions.jwtSecret");
    return strapi.plugins["users-permissions"].services.jwt.sign(
      payload,
      secret,
      jwtOptions
    );
  };

  // Override the callback controller to include userType in JWT
  const originalCallback = plugin.controllers.auth.callback;
  plugin.controllers.auth.callback = async (ctx: any) => {
    const provider = ctx.params.provider || "local";
    const params = ctx.request.body;

    const store = strapi.store({ type: "plugin", name: "users-permissions" });
    const grantSettings: any = await store.get({ key: "grant" });
    const grantProvider = provider === "local" ? "email" : provider;

    if (!grantSettings[grantProvider]?.enabled) {
      throw new utils.errors.ApplicationError("This provider is disabled");
    }

    if (provider === "local") {
      const { identifier, password } = params;

      if (!identifier || !password) {
        throw new utils.errors.ValidationError("identifier and password are required");
      }

      const user = await strapi
        .query("plugin::users-permissions.user")
        .findOne({
          where: {
            $or: [
              { email: identifier.toLowerCase() },
              { username: identifier },
            ],
          },
        });

      if (!user) {
        throw new utils.errors.ValidationError("Invalid identifier or password");
      }

      if (!user.password) {
        throw new utils.errors.ValidationError("Invalid identifier or password");
      }

      const validPassword = await strapi
        .plugin("users-permissions")
        .service("user")
        .validatePassword(password, user.password);

      if (!validPassword) {
        throw new utils.errors.ValidationError("Invalid identifier or password");
      }

      const advancedSettings: any = await store.get({ key: "advanced" });
      const requiresConfirmation = advancedSettings.email_confirmation;

      if (requiresConfirmation && !user.confirmed) {
        throw new utils.errors.ApplicationError("Your account email is not confirmed");
      }

      if (user.blocked) {
        throw new utils.errors.ApplicationError("Your account has been blocked by an administrator");
      }

      // Issue JWT with userType included in payload
      const jwt = strapi
        .plugin("users-permissions")
        .service("jwt")
        .issue({
          id: user.id,
          userType: user.userType || "reseller",
        });

      const sanitizedUser = await sanitizeUser(user, ctx);

      ctx.body = {
        jwt,
        user: sanitizedUser,
      };
    } else {
      // For non-local providers, use the original callback
      await originalCallback(ctx);
    }
  };

  return plugin;
};
