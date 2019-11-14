import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { User, Roles } from 'prisma';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  public canActivate(context: ExecutionContext): boolean {
    const role = this.reflector.get<Roles>('role', context.getHandler());
    if (!role) return true;

    const request = context.switchToHttp().getRequest() as Request;
    const user = request.user as User;
    return user.role === role;
  }
}