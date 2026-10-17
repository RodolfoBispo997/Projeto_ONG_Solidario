import jwt from "jsonwebtoken";

export function gerarToken(id: string, role: string) {
  const segredo = process.env.JWT_SECRET;

  if (!segredo) {
    throw new Error("JWT_SECRET não configurado");
  }

  return jwt.sign({ role }, segredo, {
    subject: id,
    expiresIn: "1d",
  });
}
