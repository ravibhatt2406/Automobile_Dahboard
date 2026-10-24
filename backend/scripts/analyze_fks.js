const fs = require('fs');
const summary = JSON.parse(fs.readFileSync('scripts/audit_summary.json', 'utf8'));

console.log('=== FOREIGN KEYS REFERENCING FRANCHISES ===');
const franchiseFKs = summary.foreignKeyConstraints.filter(fk => fk.foreign_table_name === 'franchises');
console.log(franchiseFKs.map(fk => `${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name} (ON DELETE ${fk.delete_rule})`).join('\n'));

console.log('\n=== FOREIGN KEYS REFERENCING BRANCHES ===');
const branchFKs = summary.foreignKeyConstraints.filter(fk => fk.foreign_table_name === 'branches');
console.log(branchFKs.map(fk => `${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name} (ON DELETE ${fk.delete_rule})`).join('\n'));

console.log('\n=== SUMMARY OF FRANCHISES AND BRANCHES TO CLEAN UP ===');
summary.franchises.forEach(f => {
  console.log(`Franchise: ${f.name} [Code: ${f.code}, ID: ${f.id}]`);
  f.branches.forEach(b => {
    console.log(`   - Branch: ${b.name} [Code: ${b.code}, City: ${b.city}, ID: ${b.id}]`);
  });
});
