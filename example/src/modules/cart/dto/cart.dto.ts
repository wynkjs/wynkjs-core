import { DTO, CommonDTO } from "wynkjs";

// Create DTO
export const CreateCartDTO = DTO.Strict({
  name: DTO.String({
    minLength: 2,
    maxLength: 100,
    description: "Name of the cart",
    required: "Name is required",
    minLengthMessage: "Name must be at least 2 characters long",
    maxLengthMessage: "Name must not exceed 100 characters",
  }),

  // Add more fields as needed
});

export interface CreateCartType {
  name: string;
  // Add more fields as needed
}

// Update DTO
export const UpdateCartDTO = DTO.Strict({
  name: DTO.String({ minLength: 2, maxLength: 100 }),
  // Add more fields as needed
});

export interface UpdateCartType {
  name: string;
  // Add more fields as needed
}

// ID Parameter DTO
export const CartIdDto = DTO.Object({
  id: DTO.String(),
});
