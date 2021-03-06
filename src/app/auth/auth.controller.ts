import { Controller, UseGuards, Get, Post, Req, Redirect } from '@nestjs/common';
import { Request } from 'express';

import { environment } from '@env';
import { Public } from 'common/decorators';
import { GithubGuard } from 'common/guards';

@Controller('auth')
export class AuthController {
  @Public()
  @UseGuards(GithubGuard)
  @Get()
  public login() {}

  @Public()
  @UseGuards(GithubGuard)
  @Get('/callback')
  @Redirect(environment.loginRedirect)
  public callback() {}

  @Get('/active')
  public activeSession(): boolean {
    return true;
  }

  @Public()
  @Get('/logout')
  @Redirect(environment.loginRedirect)
  public logout(@Req() req: Request) {
    req.logout();
  }
}
