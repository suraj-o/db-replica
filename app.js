import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

app.use(express.json());
let isTrue = false

// Helper: Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
};
const isAdmin = (req, res, next) => {
    if (req.user?.role?.toLowerCase() !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }
    next();
  };
  

// Middleware: Authenticate requests
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'Unauthorized' });

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if(!isTrue){
        console.log(decoded)
        isTrue=true
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// -------------------- Routes --------------------

// User registration
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
    });
    res.status(201).json({ message: 'User created', userId: user.id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// User login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.role);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// Get all products
app.get('/products', async (_req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get product by ID
app.get('/products/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Search products by name
app.get('/products/search', async (req, res) => {
  try {
    const { q } = req.query;
    const products = await prisma.product.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Place an order (protected)
app.post('/orders', authenticate, async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const totalPrice = product.price * quantity;
    const order = await prisma.order.create({
      data: {
        userId: req.user.userId,
        productId,
        quantity,
        totalPrice,
      },
    });

    res.status(201).json({ message: 'Order placed', orderId: order.id });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});



  
  // Add a new product (admin only)
  app.post('/admin/products', authenticate, isAdmin, async (req, res) => {
    try {
      const { name, description, price, imageUrl } = req.body;
  
      if (!name || !description || typeof price !== 'number') {
        return res.status(400).json({ message: 'Name, description, and valid price are required' });
      }
  
      const product = await prisma.product.create({
        data: {
          name,
          description,
          price,
          imageUrl, // this can be undefined (optional)
        },
      });
  
      res.status(201).json({ message: 'Product added', product });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err });
    }
  });
    
  // Get all orders (admin only)
  app.get('/admin/orders', authenticate, isAdmin, async (_req, res) => {
    try {
      const orders = await prisma.order.findMany({
        include: {
          user: { select: { email: true } },
          product: { select: { name: true, price: true } },
        },
      });
      res.json(orders);
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err });
    }
  });
  
// -------------------- Start Server --------------------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
