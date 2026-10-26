import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

describe('OrdersController customer identity', () => {
  const service = {
    findOneForCustomer: jest.fn(),
    findGroupsByCustomer: jest.fn(),
  };
  const controller = new OrdersController(service as unknown as OrdersService);

  beforeEach(() => jest.clearAllMocks());

  it('passes the authenticated customer to the ownership-aware detail query', async () => {
    const req = { user: { id: 'customer' } };
    await controller.findOne('order', req);
    expect(service.findOneForCustomer).toHaveBeenCalledWith('order', req.user);
  });

  it('passes the authenticated customer when an identifier is supplied in the URL', async () => {
    const req = { user: { id: 'customer' } };
    await controller.findByCustomer('other-customer', req);
    expect(service.findGroupsByCustomer).toHaveBeenCalledWith(
      'other-customer',
      req.user,
    );
  });
});
