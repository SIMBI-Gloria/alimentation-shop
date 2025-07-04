const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// In-memory data (temporary, resets when server restarts)
let users = [
  { id: 1, username: 'boss', password: 'boss123', role: 'boss', name: 'Shop Owner', active: true },
  { id: 2, username: 'manager1', password: 'manager123', role: 'manager', name: 'Alice Manager', active: true },
  { id: 3, username: 'sales1', password: 'sales123', role: 'sales', name: 'Jean Kagame', active: true },
  { id: 4, username: 'sales2', password: 'sales456', role: 'sales', name: 'Marie Bizimana', active: true },
];

let products = [
  { id: 1, name: 'Bread', category: 'Bakery', price: 800, stock: 25, image: '🍞' },
  { id: 2, name: 'Milk', category: 'Dairy', price: 1200, stock: 15, image: '🥛' },
  { id: 3, name: 'Apples', category: 'Fruits', price: 2500, stock: 30, image: '🍎' },
  { id: 4, name: 'Bananas', category: 'Fruits', price: 1500, stock: 20, image: '🍌' },
  { id: 5, name: 'Cheese', category: 'Dairy', price: 3500, stock: 12, image: '🧀' },
  { id: 6, name: 'Tomatoes', category: 'Vegetables', price: 1800, stock: 18, image: '🍅' },
  { id: 7, name: 'Pasta', category: 'Pantry', price: 900, stock: 40, image: '🍝' },
  { id: 8, name: 'Eggs', category: 'Dairy', price: 2000, stock: 22, image: '🥚' },
];

let sales = [];

// --- USERS ---
app.get('/api/users', (req, res) => res.json(users));
app.post('/api/users', (req, res) => {
  const user = { ...req.body, id: users.length + 1, active: true };
  users.push(user);
  res.status(201).json(user);
});
app.put('/api/users/:id', (req, res) => {
  const id = Number(req.params.id);
  users = users.map(u => u.id === id ? { ...u, ...req.body } : u);
  res.json(users.find(u => u.id === id));
});

// --- PRODUCTS ---
app.get('/api/products', (req, res) => res.json(products));
app.post('/api/products', (req, res) => {
  const product = { ...req.body, id: products.length + 1 };
  products.push(product);
  res.status(201).json(product);
});
app.put('/api/products/:id', (req, res) => {
  const id = Number(req.params.id);
  products = products.map(p => p.id === id ? { ...p, ...req.body } : p);
  res.json(products.find(p => p.id === id));
});
app.delete('/api/products/:id', (req, res) => {
  const id = Number(req.params.id);
  products = products.filter(p => p.id !== id);
  res.status(204).end();
});

// --- SALES ---
app.get('/api/sales', (req, res) => res.json(sales));
app.post('/api/sales', (req, res) => {
  const sale = { ...req.body, id: sales.length + 1, date: new Date().toISOString().split('T')[0] };
  sales.unshift(sale);
  res.status(201).json(sale);
});

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));