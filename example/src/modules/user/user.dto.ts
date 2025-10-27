import { DTO, CommonDTO, Use } from "wynkjs";

export const CreateUserDTO = DTO.Strict({
  name: DTO.Optional(DTO.String({ minLength: 2, maxLength: 50 })),
  email: CommonDTO.Email({
    description: "User email address",
  }),
  mobile: DTO.Optional(
    DTO.String({
      pattern: "^[6-9]{1}[0-9]{9}$",
      error: "Invalid mobile number",
    })
  ),
  age: DTO.Optional(
    DTO.Number({ minimum: 18, error: "Age must be at least 18" })
  ),
});

export interface CreateUserType {
  name?: string;
  email?: string;
  mobile?: string;
  age?: number;
}

export const UserQueryDto = DTO.Strict({
  includePosts: DTO.Optional(DTO.Boolean({ default: false })),
  includeComments: DTO.Optional(DTO.Boolean({ default: false })),
  query1: DTO.Optional(DTO.String()),
  query2: DTO.Optional(DTO.String()),
});

export type UserQueryType = {
  includePosts?: boolean;
  includeComments?: boolean;
  query1?: string;
  query2?: string;
};

export const UserUpdateDTO = DTO.Strict({
  email: DTO.Optional(
    DTO.String({
      format: "email",
      minLength: 5,
    })
  ),
  age: DTO.Optional(DTO.Number({ minimum: 18 })),
});

export interface UserUpdateType {
  email?: string;
  age?: number;
}

export const UserIdDto = DTO.Object({
  id: DTO.String({ minLength: 2, maxLength: 50 }),
});

export interface ParamIdType {
  id: string;
}

// For routes with multiple params like /:id1/:id2
export const MultiParamDto = DTO.Object({
  id1: DTO.String({ minLength: 2, maxLength: 50 }),
  id2: DTO.String({ minLength: 2, maxLength: 50 }),
});

export interface MultiParamType {
  id1: string;
  id2: string;
}
