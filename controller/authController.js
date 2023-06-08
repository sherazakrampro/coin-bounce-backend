const Joi = require("joi");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const UserDTO = require("../dto/user");
const JWTService = require("../services/JWTService");
const RefreshToken = require("../models/token");

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,25}$/;

const authController = {
  // register controller
  async register(req, res, next) {
    // 1. validate user input

    // create userRegisterSchema
    const userRegisterSchema = Joi.object({
      username: Joi.string().min(5).max(30).required(),
      name: Joi.string().max(30).required(),
      email: Joi.string().email().required(),
      password: Joi.string().pattern(passwordPattern).required(),
      confirmPassword: Joi.ref("password"),
    });

    // validation of userRegisterSchema
    const { error } = userRegisterSchema.validate(req.body);

    // 2. if error in validation -> return error via middleware
    if (error) {
      return next(error);
    }

    // 3. check if email or username is already registered -> return an error
    const { username, name, email, password } = req.body;

    try {
      const emailInUse = await User.exists({ email });
      const usernameInUse = await User.exists({ username });

      // checking email
      if (emailInUse) {
        const error = {
          status: 409,
          message: "Email is already registered, use another email",
        };
        return next(error);
      }

      // checking username
      if (usernameInUse) {
        const error = {
          status: 409,
          message: "Username is not available, choose another username",
        };
        return next(error);
      }
    } catch (error) {
      return next(error);
    }

    // 4. if no error -> password hash
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. store user data in DB

    let accessToken;
    let refreshToken;

    let user;

    try {
      const userToRegister = new User({
        name, //name:name
        username, //username:username
        email, //email:email
        password: hashedPassword,
      });

      // storing in database
      user = await userToRegister.save();

      // tokens generation
      accessToken = JWTService.signAccessToken({ _id: user._id }, "30m");

      refreshToken = JWTService.signRefreshToken({ _id: user._id }, "60m");
    } catch (error) {
      return next(error);
    }

    // sending access token in cookie
    res.cookie("accessToken", accessToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });

    // store refresh token in database
    await JWTService.storeRefreshToken(refreshToken, user._id);

    // sending refresh token in cookie
    res.cookie("refreshToken", refreshToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });

    // 6. send response

    const userDto = new UserDTO(user);

    return res.status(201).json({ user: userDto, auth: true });
  },

  // login controller
  async login(req, res, next) {
    // 1. validate user input
    // 2. if validation error, return error via middleware
    // 3. match username and password
    // 4. return response

    // we expect input data to be in such shape
    const userLoginSchema = Joi.object({
      username: Joi.string().min(5).max(30).required(),
      password: Joi.string().pattern(passwordPattern),
    });

    const { error } = userLoginSchema.validate(req.body);

    if (error) {
      return next(error);
    }

    const { username, password } = req.body;
    // const username = req.body.username;
    // const password =  req.body.password;

    let user;

    try {
      // match username
      user = await User.findOne({ username: username });

      if (!user) {
        const error = {
          status: 401,
          message: "Invalid username or password",
        };
        return next(error);
      }

      // match password
      // req.body.password -> hash -> match password
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        const error = {
          status: 401,
          message: "Invalid username or password",
        };
        return next(error);
      }
    } catch (error) {
      return next(error);
    }

    const accessToken = JWTService.signAccessToken({ _id: user._id }, "30m");

    const refreshToken = JWTService.signRefreshToken({ _id: user._id }, "60m");

    // update refresh token in database
    try {
      await RefreshToken.updateOne(
        {
          _id: user._id,
        },
        { token: refreshToken },
        { upsert: true } // will insert new record if there is no existing record
      );
    } catch (error) {
      return next(error);
    }

    // sending access token in cookie
    res.cookie("accessToken", accessToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });

    // sending refresh token in cookie
    res.cookie("refreshToken", refreshToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });

    const userDto = new UserDTO(user);

    return res.status(200).json({ user: userDto, auth: true });
  },

  // logout controller
  async logout(req, res, next) {
    // delete refresh token from database
    const { refreshToken } = req.cookies;

    try {
      await RefreshToken.deleteOne({ token: refreshToken });
    } catch (error) {
      return next(error);
    }

    // delete cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    // send response
    res.status(200).json({ user: null, auth: false });
  },

  // refresh controller
  async refresh(req, res, next) {
    // get refreshToken from cookies
    const originalRefreshToken = req.cookies.refreshToken;

    let id;

    try {
      id = JWTService.verifyRefreshToken(originalRefreshToken)._id;
    } catch (e) {
      const error = {
        status: 401,
        message: "Unauthorized",
      };
      return next(error);
    }

    // verify refreshToken
    try {
      const match = RefreshToken.findOne({
        _id: id,
        token: originalRefreshToken,
      });

      if (!match) {
        const error = {
          status: 401,
          message: "Unauthorized",
        };
        return next(error);
      }
    } catch (e) {
      return next(e);
    }

    // generate new token
    try {
      const accessToken = JWTService.signAccessToken({ _id: id }, "30m");

      const refreshToken = JWTService.signRefreshToken({ _id: id }, "60m");

      // update in database
      await RefreshToken.updateOne({ _id: id }, { token: refreshToken });

      // send cookies
      res.cookie("accessToken", accessToken, {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
      });

      res.cookie("refreshToken", refreshToken, {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
      });
    } catch (error) {
      return next(error);
    }

    // send response
    const user = await User.findOne({ _id: id });

    const userDto = new UserDTO(user);

    return res.status(200).json({ user: userDto, auth: true });
  },
};

module.exports = authController;
