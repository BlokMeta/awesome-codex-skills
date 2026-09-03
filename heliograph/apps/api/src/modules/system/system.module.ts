import { Module } from '@nestjs/common';
import { APP_VERSION } from '../../shared/tokens.js';
import { ConfigModule } from '../config/config.module.js';
import { SystemController } from './interface/system.controller.js';

@Module({
  imports: [ConfigModule],
  controllers: [SystemController],
  providers: [{ provide: APP_VERSION, useValue: process.env['HG_VERSION'] ?? '0.0.1' }],
})
export class SystemModule {}
