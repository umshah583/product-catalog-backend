import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class BroadcastNotificationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  body!: string;
}
