import dotenv from "dotenv";

dotenv.config();

export const ENV = {
  port: process.env.PORT,
  mongoose: process.env.MONGOOSE,
  secret: process.env.JWT_SECRET,
  jwt_expires_in: process.env.JWT_EXPIRES_IN,
  jwt_cookie_expires_day: process.env.JWT_EXPIRES_IN,
  nodeEnv: process.env.NODE_ENV,
  frontend: process.env.CLIENT_URL,
};
