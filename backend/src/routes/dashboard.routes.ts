import { Router } from "express";
import { autenticar } from "../middlewares/auth.middleware.js";
import { autorizar } from "../middlewares/role.middleware.js";
import {
  dashboardDoador,
  dashboardOng,
} from "../controllers/dashboard.controller.js";

const router = Router();
router.get("/ngo/dashboard", autenticar, autorizar("NGO"), dashboardOng);
router.get("/donor/dashboard", autenticar, autorizar("DONOR"), dashboardDoador);

export default router;
