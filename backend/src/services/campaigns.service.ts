import { prisma } from "../lib/prisma.js";

export async function listarCategorias() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
  });
}

type DadosCampanha = {
  title: string;
  description: string;
  categoryId: string;
  goalQuantity: number;
  unit: string;
  startDate?: string;
  endDate?: string;
};

type EdicaoCampanha = {
  title?: string;
  description?: string;
  categoryId?: string;
  goalQuantity?: number;
  unit?: string;
  startDate?: string;
  endDate?: string | null;
  status?: "DRAFT" | "ACTIVE";
};

export async function criarCampanha(userId: string, dados: DadosCampanha) {
  const ong = await prisma.organization.findUnique({
    where: { userId },
  });

  if (!ong) {
    throw new Error("ONG não encontrada");
  }

  const categoria = await prisma.category.findUnique({
    where: { id: dados.categoryId },
  });

  if (!categoria) {
    throw new Error("Categoria não encontrada");
  }

  return prisma.campaign.create({
    data: {
      title: dados.title,
      description: dados.description,
      organizationId: ong.id,
      categoryId: dados.categoryId,
      goalQuantity: dados.goalQuantity,
      unit: dados.unit,
      startDate: dados.startDate ? new Date(dados.startDate) : new Date(),
      endDate: dados.endDate ? new Date(dados.endDate) : null,
      status: "DRAFT",
    },
  });
}

export async function listarCampanhasPublicas(
  categoryId?: string,
  city?: string,
) {
  const agora = new Date();

  return prisma.campaign.findMany({
    where: {
      status: "ACTIVE",
      startDate: { lte: agora },
      OR: [{ endDate: null }, { endDate: { gt: agora } }],
      ...(categoryId ? { categoryId } : {}),
      ...(city
        ? {
            organization: {
              city: {
                equals: city,
                mode: "insensitive",
              },
            },
          }
        : {}),
    },
    include: {
      category: true,
      organization: {
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function buscarCampanhaPorId(id: string) {
  const agora = new Date();

  return prisma.campaign.findFirst({
    where: {
      id,
      status: "ACTIVE",
      startDate: { lte: agora },
      OR: [{ endDate: null }, { endDate: { gt: agora } }],
    },
    include: {
      category: true,
      organization: {
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
        },
      },
    },
  });
}

export async function editarCampanha(
  id: string,
  userId: string,
  dados: EdicaoCampanha,
) {
  const campanha = await prisma.campaign.findUnique({
    where: { id },
    include: { organization: true },
  });

  if (!campanha) {
    throw new Error("Campanha não encontrada");
  }

  if (campanha.organization.userId !== userId) {
    throw new Error("Acesso não permitido");
  }

  if (campanha.status === "COMPLETED" || campanha.status === "CANCELED") {
    throw new Error("Campanha não pode ser editada");
  }

  if (campanha.status === "ACTIVE" && dados.status === "DRAFT") {
    throw new Error("Campanha ativa não pode voltar para rascunho");
  }

  if (dados.categoryId) {
    const categoria = await prisma.category.findUnique({
      where: { id: dados.categoryId },
    });

    if (!categoria) {
      throw new Error("Categoria não encontrada");
    }
  }

  const inicio = dados.startDate
    ? new Date(dados.startDate)
    : campanha.startDate;

  const fim =
    dados.endDate === null
      ? null
      : dados.endDate
        ? new Date(dados.endDate)
        : campanha.endDate;

  if (
    Number.isNaN(inicio.getTime()) ||
    (fim && (Number.isNaN(fim.getTime()) || fim < inicio))
  ) {
    throw new Error("Datas inválidas");
  }

  return prisma.campaign.update({
    where: { id },
    data: {
      ...dados,
      startDate: dados.startDate ? inicio : undefined,
      endDate: dados.endDate !== undefined ? fim : undefined,
    },
  });
}
