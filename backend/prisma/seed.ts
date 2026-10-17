import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Alimentos", slug: "alimentos" },
  { name: "Roupas", slug: "roupas" },
  { name: "Higiene", slug: "higiene" },
  { name: "Material escolar", slug: "material-escolar" },
  { name: "Medicamentos", slug: "medicamentos" },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
  }

  console.log(`Seed concluído: ${categories.length} categorias processadas.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
