// /**
//  * Adds seed data to your db
//  *
//  * @see https://www.prisma.io/docs/guides/database/seed-database
//  */
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'];
// const conversionRates: Record<string, Record<string, number>> = {
//   USD: { EUR: 0.85, GBP: 0.73, JPY: 110.5, CAD: 1.25, AUD: 1.35, CHF: 0.92 },
//   EUR: { USD: 1.18, GBP: 0.86, JPY: 130.2, CAD: 1.47, AUD: 1.59, CHF: 1.08 },
//   GBP: { USD: 1.37, EUR: 1.16, JPY: 151.5, CAD: 1.71, AUD: 1.85, CHF: 1.26 },
//   JPY: {
//     USD: 0.009,
//     EUR: 0.0077,
//     GBP: 0.0066,
//     CAD: 0.011,
//     AUD: 0.012,
//     CHF: 0.0083,
//   },
//   CAD: { USD: 0.8, EUR: 0.68, GBP: 0.58, JPY: 88.4, AUD: 1.08, CHF: 0.74 },
//   AUD: { USD: 0.74, EUR: 0.63, GBP: 0.54, JPY: 81.9, CAD: 0.93, CHF: 0.68 },
//   CHF: { USD: 1.09, EUR: 0.93, GBP: 0.79, JPY: 120.1, CAD: 1.36, AUD: 1.47 },
// };

// async function main() {
//   console.log('🌱 Seeding database...');

//   // Clear existing data
//   await prisma.conversion.deleteMany();
//   await prisma.statistic.deleteMany();

//   // Generate random conversions (last 30 days)
//   const conversions = [];
//   const currencyCount: Record<string, number> = {};

//   for (let i = 0; i < 50; i++) {
//     const sourceCurrency =
//       currencies[Math.floor(Math.random() * currencies.length)];
//     let targetCurrency =
//       currencies[Math.floor(Math.random() * currencies.length)];

//     // Ensure source and target are different
//     while (targetCurrency === sourceCurrency) {
//       targetCurrency =
//         currencies[Math.floor(Math.random() * currencies.length)];
//     }

//     const sourceAmount = Math.floor(Math.random() * 10000) + 100; // 100-10100
//     const rate = conversionRates[sourceCurrency][targetCurrency];
//     const targetAmount = Math.round(sourceAmount * rate);

//     // Track currency usage for statistics
//     currencyCount[sourceCurrency] = (currencyCount[sourceCurrency] || 0) + 1;

//     // Random date within last 30 days
//     const daysAgo = Math.floor(Math.random() * 30);
//     const createdAt = new Date();
//     createdAt.setDate(createdAt.getDate() - daysAgo);

//     conversions.push({
//       sourceAmount,
//       sourceCurrency,
//       targetAmount,
//       targetCurrency,
//       createdAt,
//     });
//   }

//   // Insert all conversions
//   await prisma.conversion.createMany({
//     data: conversions,
//   });

//   // Calculate statistics
//   const mostConvertedCurrency = Object.entries(currencyCount).reduce((a, b) =>
//     a[1] > b[1] ? a : b,
//   );

//   // Create statistics record
//   await prisma.statistic.create({
//     data: {
//       totalConversions: conversions.length,
//       mostConvertedCurrency: mostConvertedCurrency[0],
//       mostConvertedCurrencyAmount: mostConvertedCurrency[1],
//     },
//   });

//   console.log(`✅ Created ${conversions.length} conversions`);
//   console.log(
//     `✅ Most converted currency: ${mostConvertedCurrency[0]} (${mostConvertedCurrency[1]} times)`,
//   );
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });

console.log("Skipping seeding as it's not needed for now");
