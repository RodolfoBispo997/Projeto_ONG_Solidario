import { Router } from "express";
import {
  cadastrarDoador,
  cadastrarONG,
  login,
} from "../controllers/auth.controller.js";
import { autenticar } from "../middlewares/auth.middleware.js";
import { usuarioAtual } from "../controllers/auth.controller.js";
import { autorizar } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/register/donor", cadastrarDoador);

router.post("/register/ngo", cadastrarONG);

router.post("/login", login);

router.get("/me", autenticar, usuarioAtual);

export default router;
