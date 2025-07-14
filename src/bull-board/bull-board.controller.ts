import { Controller, Get, Res, Req, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { createBullBoard } from '@bull-board/api';
import { ExpressAdapter } from '@bull-board/express';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Controller('admin/queues')
export class BullBoardController {
  private serverAdapter: ExpressAdapter;

  constructor(@InjectQueue('appointments') private appointmentsQueue: Queue) {
    this.serverAdapter = new ExpressAdapter();
    this.serverAdapter.setBasePath('/admin/queues');

    createBullBoard({
      queues: [new BullAdapter(this.appointmentsQueue)],
      serverAdapter: this.serverAdapter,
    });
  }

  @Get('*')
  admin(@Req() req: Request, @Res() res: Response) {
    const router = this.serverAdapter.getRouter();
    router(req, res, () => {
      res.sendStatus(404);
    });
  }
}