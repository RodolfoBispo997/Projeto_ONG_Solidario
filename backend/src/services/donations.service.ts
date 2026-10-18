import { prisma } from "../lib/prisma.js";
import { Prisma } from "@prisma/client";

const campanhaPublicaWhere = (agora: Date) => ({
  status: "ACTIVE" as const,
  startDate: { lte: agora },
  OR: [{ endDate: null }, { endDate: { gt: agora } }],
});

export async function criarDoacao(
  donorId: string,
  campaignId: string,
  quantity: number,
  note?: string,
) {
  const agora = new Date();
  const campanha = await prisma.campaign.findFirst({
    where: { id: campaignId, ...campanhaPublicaWhere(agora) },
  });

  if (!campanha) throw new Error("Campanha não disponível");

  return prisma.donation.create({
    data: {
      donorId,
      campaignId,
      quantity,
      note: note?.trim() || null,
      status: "PENDING",
    },
    select: {
      id: true,
      quantity: true,
      note: true,
      status: true,
      createdAt: true,
      campaign: { select: { id: true, title: true, unit: true } },
    },
  });
}

export async function listarDoacoesDoDoador(donorId: string) {
  return prisma.donation.findMany({
    where: { donorId },
    select: {
      id: true,
      quantity: true,
      note: true,
      status: true,
      createdAt: true,
      receivedAt: true,
      campaign: { select: { id: true, title: true, unit: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listarDoacoesDaOng(userId: string) {
  return prisma.donation.findMany({
    where: { campaign: { organization: { userId } } },
    select: {
      id: true,
      quantity: true,
      note: true,
      status: true,
      createdAt: true,
      receivedAt: true,
      campaign: { select: { id: true, title: true, unit: true } },
      donor: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function confirmarDoacaoEmTransacao(donationId: string, userId: string) {
  return prisma.$transaction(
    async (tx) => {
      const doacao = await tx.donation.findUnique({
        where: { id: donationId },
        include: { campaign: { include: { organization: true } } },
      });

      if (!doacao) throw new Error("Doação não encontrada");
      if (doacao.campaign.organization.userId !== userId) {
        throw new Error("Acesso não permitido");
      }
      if (doacao.campaign.status !== "ACTIVE") {
        throw new Error("Campanha não disponível");
      }
      if (doacao.status !== "PENDING") {
        throw new Error("Doação não está pendente");
      }

      const atualizada = await tx.donation.updateMany({
        where: { id: donationId, status: "PENDING" },
        data: { status: "RECEIVED", receivedAt: new Date() },
      });

      if (atualizada.count !== 1) throw new Error("Doação não está pendente");

      const soma = await tx.donation.aggregate({
        where: { campaignId: doacao.campaignId, status: "RECEIVED" },
        _sum: { quantity: true },
      });
      const receivedQuantity = soma._sum.quantity ?? 0;
      const status =
        receivedQuantity >= doacao.campaign.goalQuantity
          ? "COMPLETED"
          : "ACTIVE";

      const campanha = await tx.campaign.update({
        where: { id: doacao.campaignId },
        data: {
          receivedQuantity,
          status,
          completionReason: status === "COMPLETED" ? "GOAL_REACHED" : null,
        },
      });

      return {
        donation: { ...doacao, status: "RECEIVED", receivedAt: new Date() },
        campaign: campanha,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function confirmarDoacao(donationId: string, userId: string) {
  for (let tentativa = 0; tentativa < 3; tentativa += 1) {
    try {
      return await confirmarDoacaoEmTransacao(donationId, userId);
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2034" ||
        tentativa === 2
      ) {
        throw error;
      }
    }
  }
  throw new Error("Falha ao confirmar doação");
}

export async function cancelarDoacao(donationId: string, donorId: string) {
  const doacao = await prisma.donation.findUnique({
    where: { id: donationId },
  });
  if (!doacao) throw new Error("Doação não encontrada");
  if (doacao.donorId !== donorId) throw new Error("Acesso não permitido");
  if (doacao.status !== "PENDING") throw new Error("Doação não está pendente");

  const atualizada = await prisma.donation.updateMany({
    where: { id: donationId, donorId, status: "PENDING" },
    data: { status: "CANCELED" },
  });
  if (atualizada.count !== 1) throw new Error("Doação não está pendente");

  return prisma.donation.findUnique({ where: { id: donationId } });
}
