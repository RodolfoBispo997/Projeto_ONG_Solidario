import type { Request, Response } from "express";
import {
  cancelarDoacao,
  confirmarDoacao,
  criarDoacao,
  listarDoacoesDaOng,
  listarDoacoesDoDoador,
} from "../services/donations.service.js";

const erroStatus: Record<string, number> = {
  "Doação não encontrada": 404,
  "Campanha não disponível": 404,
  "Acesso não permitido": 403,
  "Doação não está pendente": 409,
};

export async function registrarDoacao(req: Request, res: Response) {
  const { campaignId, quantity, note } = req.body;
  if (
    typeof campaignId !== "string" ||
    !campaignId.trim() ||
    typeof quantity !== "number" ||
    !Number.isInteger(quantity) ||
    quantity <= 0 ||
    (note !== undefined && note !== null && typeof note !== "string")
  )
    return res.status(400).json({ message: "Dados inválidos para doação" });

  try {
    return res
      .status(201)
      .json(await criarDoacao(res.locals.user.id, campaignId, quantity, note));
  } catch (error) {
    const status =
      error instanceof Error ? erroStatus[error.message] : undefined;
    return res
      .status(status ?? 500)
      .json({
        message: status ? (error as Error).message : "Erro ao registrar doação",
      });
  }
}

export async function minhasDoacoes(req: Request, res: Response) {
  return res.status(200).json(await listarDoacoesDoDoador(res.locals.user.id));
}

export async function doacoesDaOng(req: Request, res: Response) {
  return res.status(200).json(await listarDoacoesDaOng(res.locals.user.id));
}

export async function receberDoacao(req: Request, res: Response) {
  const id = req.params.id;
  if (typeof id !== "string" || !id.trim()) {
    return res.status(400).json({ message: "ID inválido" });
  }
  try {
    return res.status(200).json(await confirmarDoacao(id, res.locals.user.id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = erroStatus[message] ?? 500;
    return res
      .status(status)
      .json({ message: status === 500 ? "Erro ao confirmar doação" : message });
  }
}

export async function cancelarDoacaoController(req: Request, res: Response) {
  const id = req.params.id;
  if (typeof id !== "string" || !id.trim()) {
    return res.status(400).json({ message: "ID inválido" });
  }
  try {
    return res.status(200).json(await cancelarDoacao(id, res.locals.user.id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = erroStatus[message] ?? 500;
    return res
      .status(status)
      .json({ message: status === 500 ? "Erro ao cancelar doação" : message });
  }
}
