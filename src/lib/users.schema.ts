import { z } from "zod";

export const APP_ROLES = ["admin", "moderador", "usuario"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Administrador",
  moderador: "Moderador",
  usuario: "Usuário",
};

export const ROLE_DESCRIPTION: Record<AppRole, string> = {
  admin: "Acesso total, incluindo gestão de usuários",
  moderador: "Pode revisar conteúdos e contribuições",
  usuario: "Acesso padrão à plataforma",
};

const nome = z
  .string()
  .trim()
  .min(3, "Informe o nome completo (mínimo 3 caracteres)")
  .max(120, "Nome muito longo (máximo 120 caracteres)");

const email = z
  .string()
  .trim()
  .email("Informe um e-mail válido")
  .max(200, "E-mail muito longo");

export const senhaSchema = z
  .string()
  .min(8, "A senha precisa ter ao menos 8 caracteres")
  .max(72, "A senha pode ter no máximo 72 caracteres")
  .regex(/[a-zA-Z]/, "Inclua ao menos uma letra")
  .regex(/[0-9]/, "Inclua ao menos um número");

export const roleSchema = z.enum(APP_ROLES);

export const createUserInput = z.object({
  nomeCompleto: nome,
  email,
  password: senhaSchema,
  role: roleSchema,
  avatarUrl: z.string().max(500).nullable().optional(),
});

export const updateUserInput = z.object({
  id: z.string().uuid(),
  nomeCompleto: nome,
  role: roleSchema.optional(),
  password: senhaSchema.optional(),
  avatarUrl: z.string().max(500).nullable().optional(),
});

export const deleteUserInput = z.object({ id: z.string().uuid() });

export const signUpInput = z.object({
  nomeCompleto: nome,
  email,
  password: senhaSchema,
});

export const signInInput = z.object({
  email,
  password: z.string().min(1, "Informe sua senha"),
});
