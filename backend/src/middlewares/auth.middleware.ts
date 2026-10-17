import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function autenticar(req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Token não informado" });
    return;
  }

  const token = authorization.slice(7);
  const segredo = process.env.JWT_SECRET;

  if (!segredo) {
    res.status(500).json({ message: "Erro na configuração da API" });
    return;
  }

  try {
    const dados = jwt.verify(token, segredo);

    if (
      typeof dados === "string" ||
      !dados.sub ||
      (dados.role !== "DONOR" && dados.role !== "NGO")
    ) {
      res.status(401).json({ message: "Token inválido" });
      return;
    }

    res.locals.user = {
      id: dados.sub,
      role: dados.role,
    };

    next();
  } catch {
    res.status(401).json({ message: "Token inválido ou expirado" });
  }
}
