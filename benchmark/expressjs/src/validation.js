import { z } from "zod";

export const createUserSchema = z.object({
    username: z.string().max(100).optional(),
    email: z.string().email().max(255),
    mobile: z.string().max(20).optional(),
    password: z.string().max(255).optional(),
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
});

export const userIdSchema = z.object({
    id: z.string().uuid(),
});
