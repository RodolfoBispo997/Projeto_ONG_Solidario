import { Router } from "express";
import { cadastrarDoador } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register/donor", cadastrarDoador);

export default router;
