import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Create master user with specified credentials
    const hashedPassword = await bcrypt.hash('@Nova123', 10);

    const user = await prisma.user.upsert({
        where: { email: 'dev.felipefrancca@gmail.com' },
        update: {
            password: hashedPassword,
            name: 'Felipe França',
        },
        create: {
            email: 'dev.felipefrancca@gmail.com',
            password: hashedPassword,
            name: 'Felipe França',
            emailVerified: true,
        },
    });

    console.log('✅ Master user created:', user.email);
    console.log('🎉 Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:');
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
