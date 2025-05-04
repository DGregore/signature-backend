import { Controller, Get, Post, Body, Param, Delete, Put, ParseIntPipe, UseGuards } from '@nestjs/common'; // Import UseGuards
import { UserService, UserPublicProfile } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../auth/decorators/roles.decorator'; // Import Roles decorator
import { UserRole } from './user.entity'; // Import UserRole enum
import { RolesGuard } from '../auth/guards/roles.guard'; // Import RolesGuard

@Controller('api/users')
// Apply RolesGuard to the entire controller or specific routes
// Note: JwtAuthGuard is already applied globally via AppModule
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseGuards(RolesGuard) // Apply RolesGuard
  @Roles(UserRole.ADMIN) // Only ADMIN can create users
  create(@Body() createUserDto: CreateUserDto): Promise<UserPublicProfile> {
    return this.userService.create(createUserDto);
  }

  @Get()
  // No specific role needed, any authenticated user can list users (due to global JwtAuthGuard)
  // If only ADMIN should list all users, add @UseGuards(RolesGuard) and @Roles(UserRole.ADMIN)
  findAll(): Promise<UserPublicProfile[]> {
    return this.userService.findAll();
  }

  @Get(':id')
  // No specific role needed, any authenticated user can view a user profile
  // If only ADMIN or the user themselves should view, more complex logic/guard needed
  findOne(@Param('id', ParseIntPipe) id: number): Promise<UserPublicProfile> {
    return this.userService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN) // Only ADMIN can update users (for now)
  // If users should update themselves, a different logic/guard is needed
  update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto): Promise<UserPublicProfile> {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN) // Only ADMIN can delete users
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.userService.remove(id);
  }
}

