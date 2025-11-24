/**
 * Adds seed data to your db
 *
 * @see https://www.prisma.io/docs/guides/database/seed-database
 */
import { PrismaClient } from '@prisma/client';

import { config } from '../src/server/config';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.conversion.deleteMany();
  await prisma.statistic.deleteMany();

  // Create 5 sample conversions
  // Amounts are stored as strings (in cents) to prevent overflow
  const conversions = [
    {
      sourceAmount: '20000', // €200.00
      sourceCurrency: 'EUR',
      targetAmount: '480000', // 4,800.00 CZK
      targetCurrency: 'CZK',
    },
    {
      sourceAmount: '50000', // $500.00
      sourceCurrency: 'USD',
      targetAmount: '42500', // €425.00
      targetCurrency: 'EUR',
    },
    {
      sourceAmount: '100000', // £1,000.00
      sourceCurrency: 'GBP',
      targetAmount: '117000', // €1,170.00
      targetCurrency: 'EUR',
    },
    {
      sourceAmount: '75000', // $750.00
      sourceCurrency: 'USD',
      targetAmount: '113500', // $1,135.00 CAD
      targetCurrency: 'CAD',
    },
    {
      sourceAmount: '30000', // €300.00
      sourceCurrency: 'EUR',
      targetAmount: '24000', // £240.00
      targetCurrency: 'GBP',
    },
  ];

  await prisma.conversion.createMany({
    data: conversions,
  });

  // Fetch the automatically calculated statistics
  const stats = await prisma.statistic.findUnique({
    where: { id: config.database.statisticSingletonId },
  });

  console.log(`✅ Created ${conversions.length} conversions`);
  if (stats) {
    console.log(`✅ Total conversions: ${stats.totalConversions}`);
    console.log(
      `✅ Most converted currency: ${stats.mostConvertedCurrency} (${stats.mostConvertedCurrencyAmount})`,
    );
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
