import type { Request, Response } from "express";
import { criarDoador, criarONG, fazerLogin } from "../services/auth.service.js";
import { gerarToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";

export async function cadastrarDoador(req: Request, res: Response) {
  const { name, email, password } = req.body;
  const emailValido =
    typeof email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  if (
    !emailValido ||
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    !name.trim() ||
    !email.trim() ||
    password.length < 8
  ) {
    return res.status(400).json({
      message:
        "Dados inválidos. Informe nome, e-mail e senha de pelo menos 8 caracteres.",
    });
  }

  try {
    const usuario = await criarDoador(
      name.trim(),
      email.trim().toLowerCase(),
      password,
    );

    return res.status(201).json(usuario);
  } catch (error) {
    if (error instanceof Error && error.message === "E-mail já cadastrado") {
      return res.status(409).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Erro ao cadastrar doador",
    });
  }
}

export async function cadastrarONG(req: Request, res: Response) {
  const {
    responsibleName,
    email,
    password,
    organizationName,
    description,
    city,
    state,
    cnpj,
    phone,
  } = req.body;

  const emailValido =
    typeof email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  if (
    !emailValido ||
    typeof password !== "string" ||
    password.length < 8 ||
    ![responsibleName, organizationName, description, city, state].every(
      (valor) => typeof valor === "string" && valor.trim(),
    ) ||
    (cnpj != null && typeof cnpj !== "string") ||
    (phone != null && typeof phone !== "string")
  ) {
    return res.status(400).json({
      message: "Dados inválidos para cadastro da ONG",
    });
  }

  try {
    const usuario = await criarONG({
      responsibleName: responsibleName.trim(),
      email: email.trim().toLowerCase(),
      password,
      organizationName: organizationName.trim(),
      description: description.trim(),
      city: city.trim(),
      state: state.trim().toUpperCase(),
      cnpj: cnpj?.trim(),
      phone: phone?.trim(),
    });

    return res.status(201).json(usuario);
  } catch (error) {
    if (error instanceof Error && error.message === "E-mail já cadastrado") {
      return res.status(409).json({ message: error.message });
    }

    if (error instanceof Error && error.message === "CNPJ já cadastrado") {
      return res.status(409).json({
        message: "CNPJ já cadastrado",
      });
    }

    return res.status(500).json({
      message: "Erro ao cadastrar ONG",
    });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    return res.status(400).json({
      message: "Informe e-mail e senha",
    });
  }

  try {
    const usuario = await fazerLogin(email.trim().toLowerCase(), password);
    const token = gerarToken(usuario.id, usuario.role);

    return res.status(200).json({
      message: "Login realizado com sucesso",
      token,
      user: usuario,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "E-mail ou senha inválidos"
    ) {
      return res.status(401).json({
        message: "E-mail ou senha inválidos",
      });
    }

    return res.status(500).json({
      message: "Erro ao realizar login",
    });
  }
}

export async function usuarioAtual(req: Request, res: Response) {
  const { id } = res.locals.user;

  const usuario = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!usuario) {
    return res.status(404).json({
      message: "Usuário não encontrado",
    });
  }

  return res.json(usuario);
}
