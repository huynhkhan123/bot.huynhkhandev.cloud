import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('🌱 Seeding database...');

  // Create Plans
  const plans = [
    {
      name: 'free',
      dailyMessageLimit: 20,
      monthlyMessageLimit: 200,
      monthlyTokenLimit: 100_000,
      maxInputTokensPerRequest: 8_000,
      maxOutputTokensPerRequest: 2_000,
      allowedModels: ['gemini-1.5-flash'],
      canUseStreaming: false,
      canUseAgents: false,
    },
    {
      name: 'pro',
      dailyMessageLimit: 200,
      monthlyMessageLimit: 5000,
      monthlyTokenLimit: 5_000_000,
      maxInputTokensPerRequest: 32_000,
      maxOutputTokensPerRequest: 8_000,
      allowedModels: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gpt-4o', 'gpt-4o-mini'],
      canUseStreaming: true,
      canUseAgents: true,
    },
    {
      name: 'admin',
      dailyMessageLimit: 99999,
      monthlyMessageLimit: 99999,
      monthlyTokenLimit: 99_999_999,
      maxInputTokensPerRequest: 128_000,
      maxOutputTokensPerRequest: 32_000,
      allowedModels: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gpt-4o', 'gpt-4o-mini'],
      canUseStreaming: true,
      canUseAgents: true,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
    console.log(`  ✅ Plan: ${plan.name}`);
  }

  // Create default admin user
  const argon2 = await import('argon2');
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe@123!';
  const adminHash = await argon2.hash(adminPassword);

  const adminPlan = await prisma.plan.findUnique({ where: { name: 'admin' } });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@bot.huynhkhandev.cloud' },
    update: {},
    create: {
      email: 'admin@bot.huynhkhandev.cloud',
      username: 'admin',
      passwordHash: adminHash,
      role: 'ADMIN',
      isEmailVerified: true,
      ...(adminPlan && {
        subscription: { create: { planId: adminPlan.id } },
      }),
    },
  });

  console.log(`  ✅ Admin user: ${adminUser.email}`);
  console.log('\n🎉 Seed complete!');
  if (process.env.NODE_ENV !== 'production') {
    console.log(`  Admin password: ${adminPassword}`);
    console.log('  ⚠️  Change the admin password immediately in production!');
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
