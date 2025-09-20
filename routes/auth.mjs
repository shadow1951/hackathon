import { Router } from "express";
import { verifyToken } from "../jsonWebToken.mjs";
import { finalSignup, initialSignup, login } from "../controller/auth.mjs";

const router = Router();

router.post("/initialSignup", initialSignup);
router.post("/finalSignup", finalSignup);
router.post("/login", login);

export default router;
