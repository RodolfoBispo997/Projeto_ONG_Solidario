import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

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
