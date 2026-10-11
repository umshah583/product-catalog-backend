import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CustomerRegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  name?: string;
}

export class CustomerLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class UpdateCustomerStatusDto {
  @IsString()
  @IsIn(['PENDING', 'APPROVED', 'REJECTED'])
  status!: 'PENDING' | 'APPROVED' | 'REJECTED';
}
