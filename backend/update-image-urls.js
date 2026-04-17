import mysql from 'mysql2/promise';

// Mapping from old filename to new Cloudinary URL
const mapping = {
  '1768258064862-355988227.jpg': 'https://res.cloudinary.com/dppoj8vb3/image/upload/v1776174704/foodieapp/w0oxwxb55kf3a0s1oyz8.jpg',
  '1768352873553-95028917.jpg': 'https://res.cloudinary.com/dppoj8vb3/image/upload/v1776174705/foodieapp/fpu3deqwnvl3s6ontppl.jpg',
  '1768352967175-150569867.jpg': 'https://res.cloudinary.com/dppoj8vb3/image/upload/v1776174706/foodieapp/jvjlglmvmeckvvv1qamk.jpg',
  'image-1767644010944-835230839.png': 'https://res.cloudinary.com/dppoj8vb3/image/upload/v1776174707/foodieapp/yux7f478uus3zbzlx9gm.png',
  'img-1769408800676-756874050.jpg': 'https://res.cloudinary.com/dppoj8vb3/image/upload/v1776174708/foodieapp/qyt6mzsepwidnni2jv9o.jpg',
  'img-1771836373269-438732746.jpg': 'https://res.cloudinary.com/dppoj8vb3/image/upload/v1776174709/foodieapp/zr4nptmopqbj6nynvqsh.jpg',
  'img-1771837735948-343176073.jpg': 'https://res.cloudinary.com/dppoj8vb3/image/upload/v1776174710/foodieapp/r4xf4y6uhfymetfmhfwt.jpg',
  'img-1771838684426-915804107.jpg': 'https://res.cloudinary.com/dppoj8vb3/image/upload/v1776174712/foodieapp/yx9hguvxhz78wysol5ca.jpg',
  'img-1771838779145-967673513.jpg': 'https://res.cloudinary.com/dppoj8vb3/image/upload/v1776174713/foodieapp/dnntsvhfewgluy8cdof8.jpg',
  'img-1771838891398-335798416.jpg': 'https://res.cloudinary.com/dppoj8vb3/image/upload/v1776174714/foodieapp/amtrijy1ef5yufzf18kr.jpg',
  'img-1771843829545-349443671.jpg': 'https://res.cloudinary.com/dppoj8vb3/image/upload/v1776174714/foodieapp/eurizrmfngpyusk4qpun.jpg',
  'img-1771844018186-70134847.jpg': 'https://res.cloudinary.com/dppoj8vb3/image/upload/v1776174716/foodieapp/cy12fyrgqd3uvlfsubw3.jpg',
  'img-1771844115642-532384309.jpg': 'https://res.cloudinary.com/dppoj8vb3/image/upload/v1776174717/foodieapp/vxfcc3chn2dbbl0sbwun.jpg',
  'img-1771844182294-572341924.jpg': 'https://res.cloudinary.com/dppoj8vb3/image/upload/v1776174718/foodieapp/lcdbafkmycfs48iuoigy.jpg',
  'img-1771844638023-84926016.jpg': 'https://res.cloudinary.com/dppoj8vb3/image/upload/v1776174719/foodieapp/lmwbdz6tztxsrijulsnn.jpg',
  'img-1771844760276-439556833.jpg': 'https://res.cloudinary.com/dppoj8vb3/image/upload/v1776174719/foodieapp/isy15izu4e4sfyfp32ee.jpg',
  'img-1771844888976-736249548.jpg': 'https://res.cloudinary.com/dppoj8vb3/image/upload/v1776174721/foodieapp/oxobvvvyylr3jrifpxxf.jpg',
  'img-1771845211369-581886571.jpg': 'https://res.cloudinary.com/dppoj8vb3/image/upload/v1776174721/foodieapp/tyu4pmkd68mlj7qxrpxa.jpg',
  'img-1771845823437-509520268.jpg': 'https://res.cloudinary.com/dppoj8vb3/image/upload/v1776174722/foodieapp/netrrx3kbrlphiqytgsq.jpg',
};

async function updateTable(pool, tableName, columnName = 'image') {
  const [rows] = await pool.query(`SELECT id, ${columnName} FROM ${tableName} WHERE ${columnName} IS NOT NULL AND ${columnName} LIKE '/uploads/%'`);
  for (const row of rows) {
    const oldPath = row[columnName];
    // Extract filename from path (e.g., '/uploads/img-xxx.jpg' -> 'img-xxx.jpg')
    const filename = oldPath.split('/').pop();
    const newUrl = mapping[filename];
    if (newUrl) {
      await pool.query(`UPDATE ${tableName} SET ${columnName} = ? WHERE id = ?`, [newUrl, row.id]);
      console.log(`✅ Updated ${tableName} id ${row.id}: ${oldPath} -> ${newUrl}`);
    } else {
      console.log(`⚠️ No mapping for filename: ${filename} (table ${tableName} id ${row.id})`);
    }
  }
}

async function run() {
  // Extract connection parameters from your TiDB Cloud URL
  // URL format: mysql://user:password@host:port/database?ssl-mode=REQUIRED
  const databaseUrl = process.env.DATABASE_URL || 'mysql://4HvhAvvcPLQtgUa.root:W1fpQBHEDEe0L08V@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/foodieapp?ssl-mode=REQUIRED';
  const url = new URL(databaseUrl);

  const connectionConfig = {
    host: url.hostname,
    port: parseInt(url.port || '4000'),
    user: url.username,
    password: url.password,
    database: url.pathname.substring(1), // remove leading slash
    ssl: {
      rejectUnauthorized: true, // This enforces TLS, which is required for TiDB Serverless
    },
  };

  console.log('🔍 Connecting to database with TLS enforcement...');
  const pool = mysql.createPool(connectionConfig);

  console.log('🔍 Starting database image URL update...');
  await updateTable(pool, 'restaurants', 'image');
  await updateTable(pool, 'deals', 'image');
  await updateTable(pool, 'menu_items', 'image');
  await updateTable(pool, 'cuisines', 'image');
  console.log('🎉 All done!');
  await pool.end();
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});