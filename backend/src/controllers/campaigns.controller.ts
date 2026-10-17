import type { Request, Response } from "express";
import {
  listarCategorias,
  criarCampanha,
  listarCampanhasPublicas,
  buscarCampanhaPorId,
  editarCampanha,
  cancelarCampanha,
  calcularProgresso,
  concluirCampanha,
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

    return res.status(200).json(
      campanhas.map((campanha) => ({
        ...campanha,
        progress: calcularProgresso(
          campanha.receivedQuantity,
          campanha.goalQuantity,
        ),
      })),
    );
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

    return res.status(200).json({
      ...campanha,
      progress: calcularProgresso(
        campanha.receivedQuantity,
        campanha.goalQuantity,
      ),
    });
  } catch {
    return res.status(500).json({
      message: "Erro ao buscar campanha",
    });
  }
}

export async function atualizarCampanha(req: Request, res: Response) {
  const id = req.params.id;

  if (typeof id !== "string" || !id.trim()) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const dados = req.body;

  if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
    return res.status(400).json({ message: "Dados inválidos" });
  }

  const campos = [
    "title",
    "description",
    "categoryId",
    "goalQuantity",
    "unit",
    "startDate",
    "endDate",
    "status",
  ];

  if (
    Object.keys(dados).length === 0 ||
    Object.keys(dados).some((campo) => !campos.includes(campo))
  ) {
    return res.status(400).json({ message: "Campos inválidos" });
  }

  for (const campo of ["title", "description", "categoryId", "unit"]) {
    if (
      dados[campo] !== undefined &&
      (typeof dados[campo] !== "string" || !dados[campo].trim())
    ) {
      return res.status(400).json({ message: "Dados inválidos" });
    }
  }

  if (
    dados.goalQuantity !== undefined &&
    (typeof dados.goalQuantity !== "number" ||
      !Number.isFinite(dados.goalQuantity) ||
      dados.goalQuantity <= 0)
  ) {
    return res.status(400).json({ message: "Meta inválida" });
  }

  if (
    dados.status !== undefined &&
    dados.status !== "DRAFT" &&
    dados.status !== "ACTIVE"
  ) {
    return res.status(400).json({ message: "Status inválido" });
  }

  if (
    (dados.startDate !== undefined && typeof dados.startDate !== "string") ||
    (dados.endDate !== undefined &&
      dados.endDate !== null &&
      typeof dados.endDate !== "string")
  ) {
    return res.status(400).json({
      message: "Datas inválidas",
    });
  }

  try {
    const campanha = await editarCampanha(id, res.locals.user.id, dados);

    return res.status(200).json(campanha);
  } catch (error) {
    if (error instanceof Error) {
      const mensagens: Record<string, number> = {
        "Campanha não encontrada": 404,
        "Acesso não permitido": 403,
        "Campanha não pode ser editada": 409,
        "Categoria não encontrada": 404,
        "Datas inválidas": 400,
        "Campanha ativa não pode voltar para rascunho": 409,
      };

      const status = mensagens[error.message];

      if (status) {
        return res.status(status).json({ message: error.message });
      }
    }

    return res.status(500).json({
      message: "Erro ao editar campanha",
    });
  }
}

export async function cancelarCampanhaController(req: Request, res: Response) {
  const id = req.params.id;

  if (typeof id !== "string" || !id.trim()) {
    return res.status(400).json({
      message: "ID inválido",
    });
  }

  try {
    const campanha = await cancelarCampanha(id, res.locals.user.id);

    return res.status(200).json(campanha);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Campanha não encontrada") {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (error.message === "Acesso não permitido") {
        return res.status(403).json({
          message: error.message,
        });
      }

      if (error.message === "Campanha não pode ser cancelada") {
        return res.status(409).json({
          message: error.message,
        });
      }
    }

    return res.status(500).json({
      message: "Erro ao cancelar campanha",
    });
  }
}

export async function concluirCampanhaController(req: Request, res: Response) {
  const id = req.params.id;
  if (typeof id !== "string" || !id.trim()) {
    return res.status(400).json({ message: "ID inválido" });
  }
  try {
    return res.status(200).json(await concluirCampanha(id, res.locals.user.id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status: Record<string, number> = {
      "Campanha não encontrada": 404,
      "Acesso não permitido": 403,
      "Campanha não pode ser concluída": 409,
    };
    return res.status(status[message] ?? 500).json({ message: status[message] ? message : "Erro ao concluir campanha" });
  }
}
