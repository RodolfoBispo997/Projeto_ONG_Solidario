import { prisma } from "../lib/prisma.js";

function arredondar(valor: number) {
  return Math.round(valor * 100) / 100;
}

export async function obterDashboardOng(userId: string) {
  const organizacao = await prisma.organization.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!organizacao) throw new Error("ONG não encontrada");

  const campanhas = await prisma.campaign.findMany({
    where: { organizationId: organizacao.id },
    select: {
      id: true,
      title: true,
      status: true,
      goalQuantity: true,
      unit: true,
      category: { select: { name: true } },
      donations: {
        where: { status: "RECEIVED" },
        select: { quantity: true, donorId: true, receivedAt: true },
      },
    },
  });

  const doacoesRecebidas = campanhas.flatMap((campanha) =>
    campanha.donations.map((doacao) => ({ ...doacao, campanha })),
  );
  const doadoresUnicos = new Set(
    doacoesRecebidas.map((doacao) => doacao.donorId),
  );
  const recebidaPorUnidade = new Map<string, number>();
  for (const doacao of doacoesRecebidas) {
    const unidade = doacao.campanha.unit;
    recebidaPorUnidade.set(
      unidade,
      (recebidaPorUnidade.get(unidade) ?? 0) + doacao.quantity,
    );
  }

  const arrecadacaoPorMes = new Map<
    string,
    { year: number; month: number; quantity: number; unit: string }
  >();
  const arrecadacaoPorCategoria = new Map<
    string,
    { category: string; quantity: number; unit: string }
  >();

  for (const doacao of doacoesRecebidas) {
    if (!doacao.receivedAt) continue;
    const year = doacao.receivedAt.getUTCFullYear();
    const month = doacao.receivedAt.getUTCMonth() + 1;
    const monthKey = `${year}-${month}-${doacao.campanha.unit}`;
    const mensal = arrecadacaoPorMes.get(monthKey) ?? {
      year,
      month,
      quantity: 0,
      unit: doacao.campanha.unit,
    };
    mensal.quantity += doacao.quantity;
    arrecadacaoPorMes.set(monthKey, mensal);

    const categoryKey = `${doacao.campanha.category.name}-${doacao.campanha.unit}`;
    const categoria = arrecadacaoPorCategoria.get(categoryKey) ?? {
      category: doacao.campanha.category.name,
      quantity: 0,
      unit: doacao.campanha.unit,
    };
    categoria.quantity += doacao.quantity;
    arrecadacaoPorCategoria.set(categoryKey, categoria);
  }

  const ranking = campanhas
    .map((campanha) => {
      const quantity = campanha.donations.reduce(
        (total, doacao) => total + doacao.quantity,
        0,
      );
      return {
        id: campanha.id,
        title: campanha.title,
        status: campanha.status,
        goalQuantity: campanha.goalQuantity,
        receivedQuantity: quantity,
        unit: campanha.unit,
        progress: arredondar(
          Math.min(100, (quantity / campanha.goalQuantity) * 100),
        ),
      };
    })
    .sort(
      (a, b) =>
        a.unit.localeCompare(b.unit) || b.receivedQuantity - a.receivedQuantity,
    );

  const totalCampanhas = campanhas.length;
  const concluidas = campanhas.filter(
    (campanha) => campanha.status === "COMPLETED",
  ).length;

  return {
    totalCampaigns: totalCampanhas,
    activeCampaigns: campanhas.filter(
      (campanha) => campanha.status === "ACTIVE",
    ).length,
    completedCampaigns: concluidas,
    totalReceivedDonations: doacoesRecebidas.length,
    receivedQuantityByUnit: [...recebidaPorUnidade.entries()].map(
      ([unit, quantity]) => ({ unit, quantity }),
    ),
    uniqueDonors: doadoresUnicos.size,
    completionRate: totalCampanhas
      ? arredondar((concluidas / totalCampanhas) * 100)
      : 0,
    collectionByMonth: [...arrecadacaoPorMes.values()].sort(
      (a, b) =>
        a.year - b.year || a.month - b.month || a.unit.localeCompare(b.unit),
    ),
    collectionByCategory: [...arrecadacaoPorCategoria.values()].sort(
      (a, b) =>
        a.category.localeCompare(b.category) || a.unit.localeCompare(b.unit),
    ),
    campaignRanking: ranking,
  };
}

export async function obterDashboardDoador(userId: string) {
  const doacoes = await prisma.donation.findMany({
    where: { donorId: userId },
    select: {
      status: true,
      quantity: true,
      campaign: { select: { unit: true } },
    },
  });
  const recebidas = doacoes.filter((doacao) => doacao.status === "RECEIVED");
  const porUnidade = new Map<string, number>();
  for (const doacao of recebidas)
    porUnidade.set(
      doacao.campaign.unit,
      (porUnidade.get(doacao.campaign.unit) ?? 0) + doacao.quantity,
    );

  return {
    totalDonations: doacoes.length,
    pendingDonations: doacoes.filter((doacao) => doacao.status === "PENDING")
      .length,
    receivedDonations: recebidas.length,
    canceledDonations: doacoes.filter((doacao) => doacao.status === "CANCELED")
      .length,
    receivedQuantityByUnit: [...porUnidade.entries()].map(
      ([unit, quantity]) => ({ unit, quantity }),
    ),
  };
}
