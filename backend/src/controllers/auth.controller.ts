import type { Request, Response } from "express";
import { criarDoador, criarONG } from "../services/auth.service.js";

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
