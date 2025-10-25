import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Injectable,
  NotFoundException,
} from "wynkjs";
import { CreateProductDTO, UpdateProductDTO, ProductIdDto } from "./product.dto.js";
import type { CreateProductType, UpdateProductType } from "./product.dto.js";
import { ProductService } from "./product.service.js";

@Injectable()
@Controller("/product")
export class ProductController {
  constructor(private productService: ProductService) {}

  @Get("/")
  async findAll() {
    const items = this.productService.findAll();
    return { data: items };
  }

  @Get({ path: "/:id", params: ProductIdDto })
  async findOne(@Param("id") id: string) {
    const item = this.productService.findById(id);
    
    if (!item) {
      throw new NotFoundException("Product not found");
    }

    return { data: item };
  }

  @Post({ path: "/", body: CreateProductDTO })
  async create(@Body() body: CreateProductType) {
    const item = this.productService.create(body);
    return { message: "Product created successfully", data: item };
  }

  @Put({ path: "/:id", params: ProductIdDto, body: UpdateProductDTO })
  async update(@Param("id") id: string, @Body() body: UpdateProductType) {
    const item = this.productService.update(id, body);
    
    if (!item) {
      throw new NotFoundException("Product not found");
    }

    return { message: "Product updated successfully", data: item };
  }

  @Patch({ path: "/:id", params: ProductIdDto })
  async partialUpdate(@Param("id") id: string, @Body() body: Partial<UpdateProductType>) {
    const item = this.productService.update(id, body);
    
    if (!item) {
      throw new NotFoundException("Product not found");
    }

    return { message: "Product updated successfully", data: item };
  }

  @Delete({ path: "/:id", params: ProductIdDto })
  async remove(@Param("id") id: string) {
    const deleted = this.productService.delete(id);
    
    if (!deleted) {
      throw new NotFoundException("Product not found");
    }

    return { message: "Product deleted successfully" };
  }
}
