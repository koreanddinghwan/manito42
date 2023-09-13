import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { UserService } from './user.service';
import { UserCreatePayloadDto } from './dto/request/userCreatePayload.dto';
import { UserUpdatePayloadDto } from './dto/request/userUpdatePayload.dto';
import { UserGetResponseDto } from './dto/response/userGetResponse.dto';
import { GetUserQueryDto } from './dto/request/userQuery.dto';
import { UserReservationGetDto } from './dto/response/userReservationGet.dto';
import { GetUserReservationQueryDto } from './dto/request/userReservationQuery.dto';
import { JwtGuard } from '../../common/guards/jwt/jwt.guard';
import { GetUserRole } from '../../common/decorators/getUserRole.decorator';
import { ReservationStatus, UserRole } from '@prisma/client';
import { GetUser } from '../../common/decorators/getUser.decorator';
import { JwtPayloadInterface } from '../../common/interfaces/jwt/jwtPayload.interface';
import { UserReservationPaginationResponseDto } from './dto/response/userReservationPaginationResponse.dto';

@Controller('/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * @access >= ADMIN
   */
  @Get('/')
  @UseGuards(JwtGuard)
  async getUsers(
    @GetUserRole() role: UserRole,
    @Query() query: GetUserQueryDto,
  ): Promise<Array<UserGetResponseDto>> {
    if (role !== UserRole.ADMIN) throw new UnauthorizedException();
    const { take, page } = query;
    return await this.userService.findMany(take, page);
  }

  /**
   * @access >= USER
   */
  @Get('/:id')
  @UseGuards(JwtGuard)
  async getUserById(@Param('id') id: number): Promise<UserGetResponseDto> {
    if (id < 0) throw new BadRequestException();
    const user = await this.userService.findById(id);
    if (!user) throw new NotFoundException();
    return user;
  }

  /**
   * @access >= ADMIN
   */
  @Post('/')
  @UseGuards(JwtGuard)
  async create(
    @GetUserRole() userRole: UserRole,
    @Body() data: UserCreatePayloadDto,
  ): Promise<UserGetResponseDto> {
    if (userRole !== UserRole.ADMIN) throw new UnauthorizedException();
    return await this.userService.create(data);
  }

  /**
   * @access >= OWNER
   */
  @Patch('/:id')
  @UseGuards(JwtGuard)
  async update(
    @GetUser() user: JwtPayloadInterface,
    @Param('id') id: number,
    @Body() data: UserUpdatePayloadDto,
  ): Promise<UserGetResponseDto> {
    if (user.id !== id && user.role !== UserRole.ADMIN) throw new UnauthorizedException();
    if (id < 0) throw new BadRequestException();
    return await this.userService.update(id, data);
  }

  @Get('/verify_nickname/:nickname')
  async verifyNickname(@Param('nickname') nickname: string): Promise<void> {
    const user = await this.userService.findByNickname(nickname);
    if (user) throw new ConflictException();
  }

  /**
   * @access >= OWNER
   */
  @Get('/:id/reservations/as_mentor')
  @UseGuards(JwtGuard)
  async getUserReservationsAsMentor(
    @GetUser() user: JwtPayloadInterface,
    @Param('id') id: number,
    @Query() query: GetUserReservationQueryDto,
  ): Promise<UserReservationPaginationResponseDto> {
    if (id < 0 || !id) throw new BadRequestException();
    if (user.id !== id && user.role !== UserRole.ADMIN) throw new UnauthorizedException();
    const { take, page, active } = query;
    const status: ReservationStatus[] = active
      ? [
          ReservationStatus.REQUEST,
          ReservationStatus.ACCEPT,
          ReservationStatus.MENTEE_CHECKED,
          ReservationStatus.MENTEE_FEEDBACK,
        ]
      : [ReservationStatus.DONE, ReservationStatus.CANCEL];
    const reservations = await this.userService.findUserReservationAsMentor(id, take, page, status);
    if (!reservations) throw new BadRequestException();
    return reservations;
  }

  /**
   * @access >= OWNER
   */
  @Get('/:id/reservations/as_mentee')
  @UseGuards(JwtGuard)
  async getUserReservationsAsMentee(
    @GetUser() user: JwtPayloadInterface,
    @Param('id') id: number,
    @Query() query: GetUserReservationQueryDto,
  ): Promise<UserReservationPaginationResponseDto> {
    if (id < 0 || !id) throw new BadRequestException();
    if (user.id !== id && user.role !== UserRole.ADMIN) throw new UnauthorizedException();
    const { take, page, active } = query;
    const status: ReservationStatus[] = active
      ? [
          ReservationStatus.REQUEST,
          ReservationStatus.ACCEPT,
          ReservationStatus.MENTEE_CHECKED,
          ReservationStatus.MENTEE_FEEDBACK,
        ]
      : [ReservationStatus.DONE, ReservationStatus.CANCEL];
    const reservations = await this.userService.findUserReservationAsMentee(id, take, page, status);
    if (!reservations) throw new BadRequestException();
    return reservations;
  }

  /**
   * @access >= OWNER
   */
  @Get('/:id/reservations/request')
  @UseGuards(JwtGuard)
  async getUserReservationRequests(
    @GetUser() user: JwtPayloadInterface,
    @Param('id') id: number,
  ): Promise<UserReservationGetDto> {
    if (id < 0 || !id) throw new BadRequestException();
    if (user.id !== id && user.role !== UserRole.ADMIN) throw new UnauthorizedException();
    const take = 100;
    const page = 0;
    const status: ReservationStatus[] = [ReservationStatus.REQUEST, ReservationStatus.ACCEPT];
    const reservations = await this.userService.findUserReservation(id, take, page, status);
    if (!reservations) throw new BadRequestException();
    return reservations;
  }
}
