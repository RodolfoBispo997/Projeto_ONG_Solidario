import { Router } from "express";
import { autenticar } from "../middlewares/auth.middleware.js";
import { autorizar } from "../middlewares/role.middleware.js";
import {
  cancelarDoacaoController,
  doacoesDaOng,
  minhasDoacoes,
  receberDoacao,
  registrarDoacao,
} from "../controllers/donations.controller.js";

const router = Router();

router.post("/donations", autenticar, autorizar("DONOR"), registrarDoacao);
router.get("/donations/me", autenticar, autorizar("DONOR"), minhasDoacoes);
router.get("/ngo/donations", autenticar, autorizar("NGO"), doacoesDaOng);
router.patch(
  "/donations/:id/receive",
  autenticar,
  autorizar("NGO"),
  receberDoacao,
);
router.patch(
  "/donations/:id/cancel",
  autenticar,
  autorizar("DONOR"),
  cancelarDoacaoController,
);

export default router;
