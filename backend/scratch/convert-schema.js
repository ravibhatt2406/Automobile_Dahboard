const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

content = content.replace('provider = "postgresql"', 'provider = "sqlite"');
content = content.replace(/ @db\.Uuid/g, '');
content = content.replace(/ @db\.Decimal\(\d+, \d+\)/g, '');

fs.writeFileSync(schemaPath, content);
console.log('✅ Adapted schema.prisma for local SQLite execution');
