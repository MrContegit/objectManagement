import { Controller, Get, Post, Body, Param, Delete, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';
import {CreateObjectDto} from "./create-object.dto";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async findAll(@Query('page') page: string = '1', @Query('limit') limit: string = '10') {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    return this.appService.findAll(pageNum, limitNum);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(@Body() dto: CreateObjectDto, @UploadedFile() file: Express.Multer.File) {
    return this.appService.create(dto, file);
  }

  @Get('objects/:id')
  async findOne(@Param('id') id: string) {
    return this.appService.findOne(id);
  }

  @Delete('objects/:id')
  async delete(@Param('id') id: string) {
    return this.appService.delete(id);
  }
}
