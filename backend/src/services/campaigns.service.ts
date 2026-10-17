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
