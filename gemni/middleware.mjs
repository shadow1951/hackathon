import { aiBot } from "./gemni.mjs";

export const middleware = async (req, res, next) => {
  const { message } = req.body;
  const result = await aiBot(message);
  res.status(200).json({
    message: result,
  });
};
