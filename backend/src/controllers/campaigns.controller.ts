import type { Request, Response } from "express";
import {
  listarCategorias,
  criarCampanha,
  listarCampanhasPublicas,
  buscarCampanhaPorId,
} from "../services/campaigns.service.js";

export async function buscarCategorias(req: Request, res: Response) {
  const categorias = await listarCategorias();

  return res.json(categorias);
}

export async function cadastrarCampanha(req: Request, res: Response) {
  const {
    title,
    description,
    categoryId,
    goalQuantity,
    unit,
    startDate,
    endDate,
  } = req.body;

  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof description !== "string" ||
    !description.trim() ||
    typeof categoryId !== "string" ||
    !categoryId.trim() ||
    typeof unit !== "string" ||
    !unit.trim() ||
    typeof goalQuantity !== "number" ||
    !Number.isFinite(goalQuantity) ||
    goalQuantity <= 0
  ) {
    return res.status(400).json({
      message: "Dados inválidos para campanha",
    });
  }

  const inicio = startDate ? new Date(startDate) : new Date();
  const fim = endDate ? new Date(endDate) : null;

  if (
    Number.isNaN(inicio.getTime()) ||
    (fim && Number.isNaN(fim.getTime())) ||
    (fim && fim < inicio)
  ) {
    return res.status(400).json({
      message: "Datas inválidas",
    });
  }

  try {
    const campanha = await criarCampanha(res.locals.user.id, {
      title: title.trim(),
      description: description.trim(),
      categoryId,
      goalQuantity,
      unit: unit.trim(),
      startDate,
      endDate,
    });

    return res.status(201).json(campanha);
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "ONG não encontrada" ||
        error.message === "Categoria não encontrada"
      ) {
        return res.status(404).json({
          message: error.message,
        });
      }
    }

    return res.status(500).json({
      message: "Erro ao criar campanha",
    });
  }
}

export async function buscarCampanhasPublicas(req: Request, res: Response) {
  const categoryId = req.query.categoryId;
  const city = req.query.city;

  if (
    (categoryId !== undefined &&
      (typeof categoryId !== "string" || !categoryId.trim())) ||
    (city !== undefined && (typeof city !== "string" || !city.trim()))
  ) {
    return res.status(400).json({
      message: "Filtros inválidos",
    });
  }

  try {
    const campanhas = await listarCampanhasPublicas(
      categoryId,
      typeof city === "string" ? city.trim() : undefined,
    );

    return res.status(200).json(campanhas);
  } catch {
    return res.status(500).json({
      message: "Erro ao listar campanhas",
    });
  }
}

export async function detalhesCampanha(req: Request, res: Response) {
  const id = req.params.id;

  if (typeof id !== "string" || !id.trim()) {
    return res.status(400).json({
      message: "ID inválido",
    });
  }

  try {
    const campanha = await buscarCampanhaPorId(id);

    if (!campanha) {
      return res.status(404).json({
        message: "Campanha não encontrada",
      });
    }

    return res.status(200).json(campanha);
  } catch {
    return res.status(500).json({
      message: "Erro ao buscar campanha",
    });
  }
}
