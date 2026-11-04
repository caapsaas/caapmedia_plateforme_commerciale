import { ProductsService } from './products.service';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { ProductImageStorage } from './product-image-storage';

const file = { originalname: 'photo.jpg' } as Express.Multer.File;
const remote = {
  imageName: 'photo.jpg',
  imageUrl: 'https://images.example.com/products/photo.jpg',
};

describe('ProductsService image persistence', () => {
  function setup() {
    const prisma = {
      item: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const storage = {
      upload: jest.fn().mockResolvedValue([remote]),
      retainDetached: jest.fn(),
    };
    const service = new ProductsService(
      prisma as unknown as PrismaService,
      storage as unknown as ProductImageStorage,
    );
    return { prisma, storage, service };
  }
  it('stores the verified R2 URL in the database', async () => {
    const { prisma, service } = setup();
    prisma.item.create.mockResolvedValue({ productImages: [remote] });
    await service.create(
      { name: 'Flyer', category: 'Print', description: 'Test' },
      [file],
    );
    const calls = prisma.item.create.mock.calls as unknown as [
      {
        data: {
          productImages: { create: { imageName: string; imageUrl: string }[] };
        };
      },
    ][];
    expect(calls[0][0].data.productImages.create[0]).toMatchObject(remote);
  });
  it('does not mutate the product when upload verification fails', async () => {
    const { prisma, storage, service } = setup();
    prisma.item.findUnique.mockResolvedValue({ id: 'p1', productImages: [] });
    storage.upload.mockRejectedValue(new Error('R2 unavailable'));
    await expect(service.update('p1', {}, [file])).rejects.toThrow(
      'R2 unavailable',
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('preserves published originals when a product is deleted', async () => {
    const { prisma, storage, service } = setup();
    prisma.item.findUnique.mockResolvedValue({
      id: 'p1',
      productImages: [remote],
    });
    await service.remove('p1');
    expect(storage.retainDetached).toHaveBeenCalledWith(remote.imageUrl);
  });
  it('rejects more than five images before uploading', async () => {
    const { prisma, storage, service } = setup();
    prisma.item.findUnique.mockResolvedValue({
      id: 'p1',
      productImages: Array(5).fill(remote),
    });
    await expect(service.update('p1', {}, [file])).rejects.toThrow('Maximum 5');
    expect(storage.upload).not.toHaveBeenCalled();
  });
  it('only exposes active public catalogue products in share pages', async () => {
    const { prisma, service } = setup();
    prisma.item.findFirst.mockResolvedValue(null);
    await expect(service.findPublicShare('hidden')).rejects.toThrow(
      'Produit indisponible',
    );
    const calls = prisma.item.findFirst.mock.calls as unknown as [
      {
        where: { id: string; isActive: boolean; isVisibleOnSite: boolean };
        select: Record<string, unknown>;
      },
    ][];
    expect(calls[0][0].where).toMatchObject({
      id: 'hidden',
      isActive: true,
      isVisibleOnSite: true,
    });
    expect(Object.keys(calls[0][0].select).sort()).toEqual([
      'description',
      'id',
      'name',
      'productImages',
    ]);
  });
});
