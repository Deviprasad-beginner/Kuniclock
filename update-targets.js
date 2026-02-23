const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.userTarget.updateMany({
        data: {
            dailySeconds: 21600
        }
    });
    console.log('Update Complete');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
