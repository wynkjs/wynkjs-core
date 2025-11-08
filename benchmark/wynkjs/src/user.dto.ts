import { DTO } from "wynkjs";

export const CreateUserDTO = DTO.Strict({
  username: DTO.Optional(DTO.String({ maxLength: 100 })),
  email: DTO.String({ format: "email", maxLength: 255 }),
  mobile: DTO.Optional(DTO.String({ maxLength: 20 })),
  password: DTO.Optional(DTO.String({ maxLength: 255 })),
  firstName: DTO.Optional(DTO.String({ maxLength: 100 })),
  lastName: DTO.Optional(DTO.String({ maxLength: 100 })),
});

export interface CreateUserType {
  username?: string;
  email: string;
  mobile?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

export const UserIdDTO = DTO.Object({
  id: DTO.String({ format: "uuid" }),
});

export interface UserIdType {
  id: string;
}
