import type { Request, Response } from "express";
import {
  obterDashboardDoador,
  obterDashboardOng,
} from "../services/dashboard.service.js";

export async function dashboardOng(_req: Request, res: Response) {
  try {
    return res.status(200).json(await obterDashboardOng(res.locals.user.id));
  } catch (error) {
    if (error instanceof Error && error.message === "ONG não encontrada")
      return res.status(404).json({ message: error.message });
    return res
      .status(500)
      .json({ message: "Erro ao carregar dashboard da ONG" });
  }
}

export async function dashboardDoador(_req: Request, res: Response) {
  try {
    return res.status(200).json(await obterDashboardDoador(res.locals.user.id));
  } catch {
    return res
      .status(500)
      .json({ message: "Erro ao carregar dashboard do doador" });
  }
}
