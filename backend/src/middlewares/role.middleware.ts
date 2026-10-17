import type { Request, Response, NextFunction } from "express";

export function autorizar(perfil: "DONOR" | "NGO") {
  return (req: Request, res: Response, next: NextFunction) => {
    const usuario = res.locals.user;

    if (!usuario) {
      return res.status(401).json({
        message: "Usuário não autenticado",
      });
    }

    if (usuario.role !== perfil) {
      return res.status(403).json({
        message: "Acesso não permitido",
      });
    }

    next();
  };
}
