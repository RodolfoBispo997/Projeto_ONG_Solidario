import { Router } from "express";
import {
  cadastrarDoador,
  cadastrarONG,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register/donor", cadastrarDoador);

router.post("/register/ngo", cadastrarONG);

export default router;
