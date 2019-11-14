import { Controller, Get } from '@nestjs/common';
import { AppService } from './services/app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  public async getHello(): Promise<string> {
    return await this.appService.getHello();
  }
}
