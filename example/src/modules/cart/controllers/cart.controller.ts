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
import { CreateCartDTO, UpdateCartDTO, CartIdDto } from "../dto/cart.dto.js";
import type { CreateCartType, UpdateCartType } from "../dto/cart.dto.js";
import { CartService } from "../services/cart.service.js";

@Injectable()
@Controller("/cart")
export class CartController {
  constructor(private cartService: CartService) {}

  @Get("/")
  async findAll() {
    const items = this.cartService.findAll();
    return { data: items };
  }

  @Get({ path: "/:id", params: CartIdDto })
  async findOne(@Param("id") id: string) {
    const item = this.cartService.findById(id);
    
    if (!item) {
      throw new NotFoundException("Cart not found");
    }

    return { data: item };
  }

  @Post({ path: "/", body: CreateCartDTO })
  async create(@Body() body: CreateCartType) {
    const item = this.cartService.create(body);
    return { message: "Cart created successfully", data: item };
  }

  @Put({ path: "/:id", params: CartIdDto, body: UpdateCartDTO })
  async update(@Param("id") id: string, @Body() body: UpdateCartType) {
    const item = this.cartService.update(id, body);
    
    if (!item) {
      throw new NotFoundException("Cart not found");
    }

    return { message: "Cart updated successfully", data: item };
  }

  @Patch({ path: "/:id", params: CartIdDto })
  async partialUpdate(@Param("id") id: string, @Body() body: Partial<UpdateCartType>) {
    const item = this.cartService.update(id, body);
    
    if (!item) {
      throw new NotFoundException("Cart not found");
    }

    return { message: "Cart updated successfully", data: item };
  }

  @Delete({ path: "/:id", params: CartIdDto })
  async remove(@Param("id") id: string) {
    const deleted = this.cartService.delete(id);
    
    if (!deleted) {
      throw new NotFoundException("Cart not found");
    }

    return { message: "Cart deleted successfully" };
  }
}
