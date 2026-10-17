import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

type DadosONG = {
  responsibleName: string;
  email: string;
  password: string;
  organizationName: string;
  description: string;
  city: string;
  state: string;
  cnpj?: string;
  phone?: string;
};

export async function criarDoador(
  name: string,
  email: string,
  password: string,
) {
  const usuarioExiste = await prisma.user.findUnique({
    where: { email },
  });

  if (usuarioExiste) {
    throw new Error("E-mail já cadastrado");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const usuario = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "DONOR",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return usuario;
}

export async function criarONG(dados: DadosONG) {
  const usuarioExiste = await prisma.user.findUnique({
    where: { email: dados.email },
  });

  if (usuarioExiste) {
    throw new Error("E-mail já cadastrado");
  }

  if (dados.cnpj) {
    const cnpjExiste = await prisma.organization.findUnique({
      where: { cnpj: dados.cnpj },
    });

    if (cnpjExiste) {
      throw new Error("CNPJ já cadastrado");
    }
  }

  const passwordHash = await bcrypt.hash(dados.password, 10);

  const usuario = await prisma.user.create({
    data: {
      name: dados.responsibleName,
      email: dados.email,
      passwordHash,
      role: "NGO",
      organization: {
        create: {
          name: dados.organizationName,
          description: dados.description,
          city: dados.city,
          state: dados.state,
          cnpj: dados.cnpj || null,
          phone: dados.phone || null,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      organization: true,
    },
  });

  return usuario;
}
