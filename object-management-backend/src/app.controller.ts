import { Controller, Get, Post, Body, Param, Delete, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';
import {CreateObjectDto} from "./create-object.dto";

@Controller('objects')
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
    console.log('=== POST /objects ===');
    console.log('DTO received:', dto);
    console.log('File received:', file ? { originalname: file.originalname, mimetype: file.mimetype, size: file.size } : 'NO FILE');
    return this.appService.create(dto, file);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.appService.findOne(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.appService.delete(id);
  }
}
