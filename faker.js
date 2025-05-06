import axios from 'axios';
import { faker } from '@faker-js/faker';

const API_URL = 'http://localhost:3000/admin/products';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc0NjUyOTQ1NCwiZXhwIjoxNzQ3MTM0MjU0fQ.b6XdkAgjS6-X8f_EtdPrmRGl9M5e_wafCRm1chBEMqo';


async function createFakeProduct() {
  const product = {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
    imageUrl: faker.image.url()
  };

  try {
    const response = await axios.post(API_URL, product, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('Created:', response.data);
  } catch (error) {
    console.error('Failed to create product:', error.response?.data || error.message);
  }
}

async function generateProducts(count = 100) {
  for (let i = 0; i < count; i++) {
    await createFakeProduct();
  }
}

generateProducts();
