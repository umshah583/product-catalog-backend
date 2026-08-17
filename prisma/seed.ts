import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seed...');

  // Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      slug: 'default',
      name: 'Default Tenant',
      isActive: true,
    },
  });
  console.log('Created tenant:', tenant.slug);

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  });
  console.log('Created user:', user.email);

  // Create categories
  const category1 = await prisma.category.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'electronics' } },
    update: {},
    create: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and accessories',
      sortOrder: 1,
      tenantId: tenant.id,
    },
  });

  const category2 = await prisma.category.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'clothing' } },
    update: {},
    create: {
      name: 'Clothing',
      slug: 'clothing',
      description: 'Fashion and apparel',
      sortOrder: 2,
      tenantId: tenant.id,
    },
  });

  const category3 = await prisma.category.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'home-garden' } },
    update: {},
    create: {
      name: 'Home & Garden',
      slug: 'home-garden',
      description: 'Home improvement and garden supplies',
      sortOrder: 3,
      tenantId: tenant.id,
    },
  });
  console.log('Created categories');

  // Create products
  await prisma.product.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: 'WBH-001' } },
    update: {
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'],
    },
    create: {
      name: 'Wireless Bluetooth Headphones',
      sku: 'WBH-001',
      slug: 'wireless-bluetooth-headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      price: 99.99,
      discountPrice: 79.99,
      currency: 'USD',
      stockStatus: 'IN_STOCK',
      featured: true,
      categoryId: category1.id,
      categoryName: category1.name,
      tenantId: tenant.id,
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'],
      specifications: {
        'Brand': 'TechSound',
        'Color': 'Black',
        'Battery Life': '20 hours',
        'Connectivity': 'Bluetooth 5.0',
      },
    },
  });

  await prisma.product.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: 'SW-002' } },
    update: {
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80'],
    },
    create: {
      name: 'Smart Watch',
      sku: 'SW-002',
      slug: 'smart-watch',
      description: 'Feature-rich smartwatch with health tracking',
      price: 199.99,
      currency: 'USD',
      stockStatus: 'IN_STOCK',
      featured: true,
      categoryId: category1.id,
      categoryName: category1.name,
      tenantId: tenant.id,
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80'],
      specifications: {
        'Brand': 'TechTime',
        'Display': '1.5 inch OLED',
        'Water Resistance': 'IP68',
        'Battery Life': '7 days',
      },
    },
  });

  await prisma.product.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: 'CT-003' } },
    update: {
      images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80'],
    },
    create: {
      name: 'Cotton T-Shirt',
      sku: 'CT-003',
      slug: 'cotton-t-shirt',
      description: 'Comfortable 100% cotton t-shirt',
      price: 29.99,
      currency: 'USD',
      stockStatus: 'IN_STOCK',
      featured: false,
      categoryId: category2.id,
      categoryName: category2.name,
      tenantId: tenant.id,
      images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80'],
      specifications: {
        'Material': '100% Cotton',
        'Sizes': 'S, M, L, XL',
        'Colors': 'White, Black, Blue',
      },
    },
  });

  await prisma.product.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: 'GTS-004' } },
    update: {
      images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&q=80'],
    },
    create: {
      name: 'Garden Tool Set',
      sku: 'GTS-004',
      slug: 'garden-tool-set',
      description: 'Complete set of essential garden tools',
      price: 49.99,
      currency: 'USD',
      stockStatus: 'IN_STOCK',
      featured: false,
      categoryId: category3.id,
      categoryName: category3.name,
      tenantId: tenant.id,
      images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&q=80'],
      specifications: {
        'Pieces': '10',
        'Material': 'Stainless Steel',
        'Includes': 'Shovel, Rake, Trowel, Pruners',
      },
    },
  });

  await prisma.product.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: 'LS-005' } },
    update: {
      images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80'],
    },
    create: {
      name: 'Laptop Stand',
      sku: 'LS-005',
      slug: 'laptop-stand',
      description: 'Ergonomic aluminum laptop stand',
      price: 39.99,
      currency: 'USD',
      stockStatus: 'LOW_STOCK',
      featured: true,
      categoryId: category1.id,
      categoryName: category1.name,
      tenantId: tenant.id,
      images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80'],
      specifications: {
        'Material': 'Aluminum',
        'Adjustable Height': 'Yes',
        'Compatibility': '10-17 inch laptops',
      },
    },
  });
  console.log('Created products');

  // Create settings
  await prisma.settings.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      companyName: 'TechCatalog',
      catalogTitle: 'Premium Products',
      whatsappNumber: '+1234567890',
      phoneNumber: '+1234567890',
      contactEmail: 'support@techcatalog.com',
      currency: 'USD',
      currencySymbol: '$',
      address: '123 Tech Street, Silicon Valley, CA 94000',
      workingHours: 'Mon-Fri: 9AM-6PM',
      aboutCompany: 'TechCatalog is your premier destination for quality tech products and accessories.',
      whatsappEnabled: true,
    },
  });
  console.log('Created settings');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
