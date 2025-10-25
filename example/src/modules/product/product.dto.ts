import { DTO, CommonDTO } from "wynkjs";

// Create DTO
export const CreateProductDTO = DTO.Strict({
  name: DTO.String({ minLength: 2, maxLength: 100 }),
  // Add more fields as needed
});

export interface CreateProductType {
  name: string;
  // Add more fields as needed
}

// Update DTO
export const UpdateProductDTO = DTO.Strict({
  name: DTO.Optional(DTO.String({ minLength: 2, maxLength: 100 })),
  // Add more fields as needed
});

export interface UpdateProductType {
  name?: string;
  // Add more fields as needed
}

// ID Parameter DTO
export const ProductIdDto = DTO.Object({
  id: DTO.String(),
});
