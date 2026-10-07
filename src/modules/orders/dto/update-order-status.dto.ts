import { IsIn } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsIn(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'])
  status!: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
}
