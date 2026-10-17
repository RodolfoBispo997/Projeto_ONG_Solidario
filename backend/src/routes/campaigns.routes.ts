import { Router } from "express";
import {
  atualizarCampanha,
  buscarCampanhasPublicas,
  buscarCategorias,
  detalhesCampanha,
} from "../controllers/campaigns.controller.js";
import { cadastrarCampanha } from "../controllers/campaigns.controller.js";
import { autenticar } from "../middlewares/auth.middleware.js";
import { autorizar } from "../middlewares/role.middleware.js";

const router = Router();

router.get("/categories", buscarCategorias);

router.post("/campaigns", autenticar, autorizar("NGO"), cadastrarCampanha);

router.get("/campaigns", buscarCampanhasPublicas);

router.get("/campaigns/:id", detalhesCampanha);

router.patch("/campaigns/:id", autenticar, autorizar("NGO"), atualizarCampanha);

export default router;
