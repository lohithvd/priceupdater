// index.js
const mysql = require('mysql');
const config = require('./config');

const dbConfig = {
  host: config.DB_HOST,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
};

function getPriceRanges(connection) {
  return new Promise((resolve, reject) => {
    connection.query('SELECT price FROM products', (error, results) => {
      if (error) {
        return reject(error);
      }

      // Calculate distinct price ranges
      const ranges = new Set();
      results.forEach((product) => {
        const priceRange = Math.floor(product.price / 50) * 50; // Group prices by range of 50
        ranges.add(priceRange);
      });

      resolve(ranges.size);
    });
  });
}

function updatePrices(connection) {
  return new Promise((resolve, reject) => {
    connection.query('UPDATE products SET price = price * 1.1', (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results.affectedRows);
    });
  });
}

exports.handler = async (event) => {
  const connection = mysql.createConnection(dbConfig);

  try {
    await new Promise((resolve, reject) => connection.connect((err) => (err ? reject(err) : resolve())));

    const priceRangeCount = await getPriceRanges(connection);

    if (priceRangeCount > 3) {
      const updatedRows = await updatePrices(connection);
      console.log(`Updated prices for ${updatedRows} products.`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Price adjustment check complete.' }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  } finally {
    connection.end();
  }
};
