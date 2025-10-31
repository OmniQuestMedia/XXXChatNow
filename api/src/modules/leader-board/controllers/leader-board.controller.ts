import { Controller, Get, HttpCode, HttpStatus, Injectable, UsePipes, ValidationPipe } from "@nestjs/common";
import { DataResponse } from "src/kernel";
import { LeaderBoardService } from "../services";

@Injectable()
@Controller('leader-board')
export class LeaderBoardController {
  constructor(
    private readonly leaderBoardService: LeaderBoardService
  ) {}

  @Get('/search')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async find(
  ): Promise<any> {
    const results = await this.leaderBoardService.getAllLeaderBoard();
    return DataResponse.ok(results);
  }
}