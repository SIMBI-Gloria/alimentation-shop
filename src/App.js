import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, Users, BarChart3, Plus, Minus, Search, ShoppingBag, DollarSign, AlertCircle, LogOut, UserPlus, Trash2, Edit, Settings, Key, UserMinus, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const AlimentationShop = () => {
  // Authentication States
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showLogin, setShowLogin] = useState(true);

  // User Management
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', name: '', role: 'sales' });
  const [showAddUser, setShowAddUser] = useState(false);

  // Main States
  const [activeTab, setActiveTab] = useState('pos');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [customers] = useState([
    { id: 1, name: 'Marie Uwimana', phone: '078-123-4567', totalPurchases: 125000 },
    { id: 2, name: 'Jean Nzeyimana', phone: '079-987-6543', totalPurchases: 98000 },
    { id: 3, name: 'Sophie Mukamana', phone: '072-555-1234', totalPurchases: 156000 },
  ]);
  const [sales, setSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', category: '', price: '', stock: '', image: '' });
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ productId: null, productName: '' });
  const [passwordChange, setPasswordChange] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  // Add a notification state
  const [notifications, setNotifications] = useState([]);

  // Password visibility state for all password fields
  const [showPassword, setShowPassword] = useState({ login: false, current: false, new: false, confirm: false });

  // Authentication Functions
  const handleLogin = () => {
    const user = users.find(u => 
      u.username === loginForm.username && 
      u.password === loginForm.password && 
      u.active
    );
    
    if (user) {
      setCurrentUser(user);
      setShowLogin(false);
      setLoginForm({ username: '', password: '' });
    } else {
      alert('Invalid credentials or user is deactivated');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowLogin(true);
    setCart([]);
    setActiveTab('pos');
  };

  // User Management Functions
  const addUser = () => {
    if (!newUser.username || !newUser.password || !newUser.name) {
      alert('Please fill all fields');
      return;
    }
    
    if (users.find(u => u.username === newUser.username)) {
      alert('Username already exists');
      return;
    }
    
    axios.post('http://localhost:5000/api/users', newUser)
      .then(res => {
        setUsers([...users, res.data]);
        setNewUser({ username: '', password: '', name: '', role: 'sales' });
        setShowAddUser(false);
        alert('User added successfully');
      })
      .catch(() => alert('Failed to add user'));
  };

  const toggleUserStatus = (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    axios.put(`http://localhost:5000/api/users/${userId}`, { ...user, active: !user.active })
      .then(res => {
        setUsers(users.map(u => u.id === userId ? res.data : u));
      })
      .catch(() => alert('Failed to update user status'));
  };

  // Cart and Sales Functions
  const addToCart = (product) => {
    if (product.stock === 0) {
      setNotifications(notifications => [
        ...notifications,
        { type: 'error', message: `Product '${product.name}' is out of stock!` }
      ]);
      alert('Product out of stock!');
      return;
    }
    
    const existingItem = cart.find(item => item.id === product.id);
    const currentQuantity = existingItem ? existingItem.quantity : 0;
    
    if (currentQuantity >= product.stock) {
      alert('Not enough stock available!');
      return;
    }
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId, newQuantity) => {
    const product = products.find(p => p.id === productId);
    
    if (newQuantity === 0) {
      removeFromCart(productId);
    } else if (newQuantity > product.stock) {
      alert('Not enough stock available!');
    } else {
      setCart(cart.map(item => 
        item.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const completeSale = () => {
    if (cart.length === 0) return;
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const itemsDetail = cart.map(item => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));
    const newSale = {
      date: new Date().toISOString().split('T')[0],
      customer: 'Walk-in',
      total: total,
      items: totalItems,
      soldBy: currentUser.name,
      soldById: currentUser.id,
      itemsDetail
    };
    axios.post('http://localhost:5000/api/sales', newSale)
      .then(res => {
        setSales([res.data, ...sales]);
        // Update stock locally
        const updatedProducts = products.map(product => {
          const cartItem = cart.find(item => item.id === product.id);
          if (cartItem) {
            const newStock = product.stock - cartItem.quantity;
            if (newStock === 0) {
              setNotifications(notifications => [
                ...notifications,
                { type: 'warning', message: `Product '${product.name}' is now out of stock!` }
              ]);
            }
            return { ...product, stock: newStock };
          }
          return product;
        });
        setProducts(updatedProducts);
        setCart([]);
        if (currentUser.role === 'sales') {
          alert(`✅ Sale Completed Successfully!\n\n💰 Total: ${total.toLocaleString()} RWF\n📦 Items Sold: ${totalItems}\n🔄 Stock Updated Automatically\n\nGreat job, ${currentUser.name}!`);
        } else {
          alert(`Sale completed! Total: ${total.toLocaleString()} RWF`);
        }
      })
      .catch(() => alert('Failed to complete sale'));
  };

  // Product Management (Boss only)
  const [editingProduct, setEditingProduct] = useState(null);

  const addProduct = () => {
    if (!newProduct.name || !newProduct.price) return;
    // Check for duplicate product name (case-insensitive)
    if (products.some(p => p.name.toLowerCase() === newProduct.name.toLowerCase())) {
      setNotifications(notifications => [
        ...notifications,
        { type: 'error', message: `Product '${newProduct.name}' already exists!` }
      ]);
      return;
    }
    const product = {
      name: newProduct.name,
      category: newProduct.category || 'Other',
      price: parseInt(newProduct.price) || 0,
      stock: parseInt(newProduct.stock) || 0,
      image: newProduct.image || '📦'
    };
    axios.post('http://localhost:5000/api/products', product)
      .then(res => {
        setProducts([...products, res.data]);
        setNewProduct({ name: '', category: '', price: '', stock: '', image: '' });
        setShowAddProduct(false);
      })
      .catch(() => alert('Failed to add product'));
  };

  const startEditProduct = (product) => {
    setEditingProduct({ ...product });
  };

  const cancelEditProduct = () => {
    setEditingProduct(null);
  };

  const saveEditProduct = () => {
    if (!editingProduct.name || !editingProduct.price) return;
    // Check for duplicate name (except for self)
    if (products.some(p => p.id !== editingProduct.id && p.name.toLowerCase() === editingProduct.name.toLowerCase())) {
      setNotifications(notifications => [
        ...notifications,
        { type: 'error', message: `Product '${editingProduct.name}' already exists!` }
      ]);
      return;
    }
    axios.put(`http://localhost:5000/api/products/${editingProduct.id}`, {
      ...editingProduct,
      price: parseInt(editingProduct.price),
      stock: parseInt(editingProduct.stock)
    })
      .then(res => {
        setProducts(products.map(product =>
          product.id === editingProduct.id ? res.data : product
        ));
        setEditingProduct(null);
        setNotifications(notifications => [
          ...notifications,
          { type: 'success', message: `Product '${editingProduct.name}' updated successfully!` }
        ]);
      })
      .catch(() => alert('Failed to update product'));
  };

  const deleteProduct = (productId) => {
    axios.delete(`http://localhost:5000/api/products/${productId}`)
      .then(() => {
        setProducts(products.filter(product => product.id !== productId));
        setDeleteConfirm({ productId: null, productName: '' });
        alert('Product deleted successfully!');
      })
      .catch(() => alert('Failed to delete product'));
  };

  const changePassword = () => {
    if (!passwordChange.currentPassword || !passwordChange.newPassword || !passwordChange.confirmPassword) {
      alert('Please fill all password fields');
      return;
    }
    
    if (passwordChange.currentPassword !== currentUser.password) {
      alert('Current password is incorrect');
      return;
    }
    
    if (passwordChange.newPassword !== passwordChange.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    if (passwordChange.newPassword.length < 6) {
      alert('New password must be at least 6 characters');
      return;
    }
    
    // Update password in users array
    setUsers(users.map(user => 
      user.id === currentUser.id 
        ? { ...user, password: passwordChange.newPassword }
        : user
    ));
    
    // Update current user
    setCurrentUser({ ...currentUser, password: passwordChange.newPassword });
    
    setPasswordChange({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordChange(false);
    alert('Password changed successfully!');
  };

  const filteredProducts = products.filter(product =>
    (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (currentUser?.role === 'boss' && globalSearch !== '' ? 
     (product.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
      product.category.toLowerCase().includes(globalSearch.toLowerCase()) ||
      product.price.toString().includes(globalSearch)) : true)
  );

  const lowStockProducts = products.filter(product => product.stock < 10);
  const mySales = currentUser?.role === 'sales' ? sales.filter(sale => sale.soldById === currentUser.id) : sales;

  // Notification system: auto-dismiss after 10 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications((prev) => prev.slice(1));
      }, 10000); // 10 seconds
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  // Fetch users, products, and sales from backend on mount
  useEffect(() => {
    axios.get('http://localhost:5000/api/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error('Error fetching users:', err));
    axios.get('http://localhost:5000/api/products')
      .then(res => setProducts(res.data))
      .catch(err => console.error('Error fetching products:', err));
    axios.get('http://localhost:5000/api/sales')
      .then(res => setSales(res.data))
      .catch(err => console.error('Error fetching sales:', err));
  }, []);

  // Login Screen
  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <ShoppingBag className="text-orange-500 w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-orange-500 via-red-500 to-yellow-400 bg-clip-text text-transparent drop-shadow-lg mb-2 tracking-wide uppercase">TSM SHOP SYSTEM</h1>
            <p className="text-gray-600 mt-2 text-lg font-medium">Please login to continue</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Username"
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div className="relative">
              <input
                type={showPassword.login ? "text" : "password"}
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => ({...p, login: !p.login}))}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 focus:outline-none"
                tabIndex={-1}
                aria-label={showPassword.login ? 'Hide password' : 'Show password'}
                style={{background: 'none', border: 'none', padding: 0, margin: 0, position: 'absolute'}}
              >
                {showPassword.login ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-orange-400">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShoppingBag className="text-orange-500 w-8 h-8" />
              <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-orange-500 via-red-500 to-yellow-400 bg-clip-text text-transparent drop-shadow-lg tracking-wide uppercase">TSM SHOP SYSTEM</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome, {currentUser.name}</p>
                <p className="text-sm text-orange-600">
                  {currentUser.role === 'boss' ? '👑 Boss' : currentUser.role === 'manager' ? '🧑‍💼 Manager' : '👨‍💼 Sales Person'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8">
            {[
              { id: 'pos', label: 'Point of Sale', icon: ShoppingCart, roles: ['boss', 'manager', 'sales'] },
              { id: 'inventory', label: 'Inventory', icon: Package, roles: ['boss', 'manager', 'sales'] },
              { id: 'customers', label: 'Customers', icon: Users, roles: ['boss'] },
              { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['boss', 'manager', 'sales'] },
              { id: 'users', label: 'User Management', icon: UserPlus, roles: ['boss'] },
              { id: 'settings', label: 'Settings', icon: Settings, roles: ['boss'] },
            ].filter(tab => tab.roles.includes(currentUser.role)).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-orange-500'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
          {notifications.map((note, idx) => (
            <div
              key={idx}
              className={`tsm-notification mb-2 px-4 py-3 rounded shadow-lg text-white font-semibold ${
                note.type === 'error' ? 'bg-red-500' : 'bg-yellow-500'
              }`}
            >
              {note.message}
            </div>
          ))}
        </div>
      )}

      <div className="container mx-auto px-6 py-8">
        {/* Point of Sale */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">
                    🛍️ Products {currentUser.role === 'sales' && '- Make Sales'}
                  </h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="🔍 Search products to sell..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-full sm:w-80"
                    />
                  </div>
                </div>
                
                {currentUser.role === 'sales' && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-blue-800 text-sm font-medium">
                      👨‍💼 <strong>Sales Mode:</strong> Click on products to add to cart. Search above to find items quickly!
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredProducts.map(product => (
                    <div
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${
                        product.stock === 0 
                          ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                          : 'bg-gradient-to-br from-orange-50 to-red-50 border-transparent hover:border-orange-300 hover:shadow-md'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">{product.image}</div>
                        <h3 className="font-semibold text-gray-800">{product.name}</h3>
                        <p className="text-sm text-gray-600">{product.category}</p>
                        <p className="text-lg font-bold text-orange-600">{product.price.toLocaleString()} RWF</p>
                        <p className={`text-xs ${product.stock === 0 ? 'text-red-500 font-semibold' : product.stock < 5 ? 'text-red-600' : 'text-gray-500'}`}>
                          Stock: {product.stock} {product.stock === 0 && '- OUT OF STOCK'}
                          {product.stock > 0 && product.stock < 5 && ' - LOW STOCK!'}
                        </p>
                        {product.stock > 0 && (
                          <p className="text-xs text-green-600 mt-1">✅ Click to add to cart</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {filteredProducts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No products found for "{searchTerm}"</p>
                    <p className="text-sm">Try a different search term</p>
                  </div>
                )}
              </div>
            </div>

            {/* Shopping Cart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">🛒 Shopping Cart</h2>
                {currentUser.role === 'sales' && cart.length > 0 && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                  </span>
                )}
              </div>
              
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Cart is empty</p>
                  {currentUser.role === 'sales' && (
                    <p className="text-sm mt-2">Click on products above to add them!</p>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{item.image}</span>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">{item.price.toLocaleString()} RWF each</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Total Items:</span>
                        <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold">Total:</span>
                        <span className="text-xl font-bold text-orange-600">
                          {cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()} RWF
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={completeSale}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105"
                    >
                      💰 Complete Sale
                    </button>
                    
                    {currentUser.role === 'sales' && (
                      <p className="text-xs text-center text-gray-500 mt-2">
                        Stock will update automatically after sale
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Inventory */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-800">
                📦 Inventory {currentUser.role === 'sales' ? '- View Only' : 'Management'}
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Global search for both boss and sales */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="🔍 Global Search (name, category, price)..."
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    className={`pl-10 pr-4 py-2 border rounded-lg focus:ring-2 w-full sm:w-80 ${currentUser.role === 'boss' ? 'border-orange-300 focus:ring-orange-500 focus:border-orange-500' : 'border-blue-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  />
                </div>
                {currentUser.role === 'boss' && (
                  <button
                    onClick={() => setShowAddProduct(!showAddProduct)}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center space-x-2 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Product</span>
                  </button>
                )}
              </div>
            </div>
            
            {currentUser.role === 'sales' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="text-blue-800 font-semibold mb-2">👨‍💼 Sales Person View</h3>
                <p className="text-blue-700 text-sm">
                  • You can <strong>view all stock levels</strong> to know what's available<br/>
                  • <strong>Stock updates automatically</strong> when you make sales in POS<br/>
                  • You <strong>cannot manually change</strong> stock numbers (only boss can)
                </p>
              </div>
            )}

            {currentUser.role === 'boss' && showAddProduct && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Add New Product</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <input
                    type="text"
                    placeholder="Product name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <input
                    type="text"
                    placeholder="Category"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <input
                    type="number"
                    placeholder="Price (RWF)"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <input
                    type="number"
                    placeholder="Stock"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <input
                    type="text"
                    placeholder="Emoji"
                    value={newProduct.image}
                    onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="flex space-x-3 mt-4">
                  <button
                    onClick={addProduct}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                  >
                    Add Product
                  </button>
                  <button
                    onClick={() => setShowAddProduct(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {lowStockProducts.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <AlertCircle className="text-red-500 w-5 h-5" />
                  <h3 className="text-lg font-semibold text-red-800">Low Stock Alert</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {lowStockProducts.map(product => (
                    <div key={product.id} className="bg-white p-3 rounded-lg border border-red-200">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{product.image}</span>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-red-600 font-semibold">Only {product.stock} left!</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                      <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      {currentUser.role === 'boss' && (
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-xs sm:text-sm">
                    {filteredProducts.map(product => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap break-words">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <span className="text-2xl">{product.image}</span>
                            <span className="font-medium">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-gray-600 break-words">{product.category}</td>
                        <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap font-semibold text-orange-600">{product.price.toLocaleString()} RWF</td>
                        <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">{product.stock}</td>
                        <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            product.stock === 0 ? 'bg-red-100 text-red-800' :
                            product.stock < 5 ? 'bg-red-100 text-red-800' :
                            product.stock < 10 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {product.stock === 0 ? 'Out of Stock' :
                             product.stock < 5 ? 'Critical' : 
                             product.stock < 10 ? 'Low' : 'Good'}
                          </span>
                        </td>
                        {currentUser.role === 'boss' && (
                          <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => startEditProduct(product)}
                                className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 flex items-center"
                                title="Edit Product"
                              >
                                <Edit className="w-3 h-3 mr-1" />Edit
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ productId: product.id, productName: product.name })}
                                className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Edit Product Modal (Boss only) */}
            {currentUser.role === 'boss' && editingProduct && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg relative animate-fade-in-down">
                  <button
                    onClick={cancelEditProduct}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold"
                    title="Close"
                  >
                    ×
                  </button>
                  <h3 className="text-lg font-semibold mb-4">Edit Product</h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <input
                      type="text"
                      placeholder="Product name"
                      value={editingProduct.name}
                      onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 col-span-2"
                    />
                    <input
                      type="text"
                      placeholder="Category"
                      value={editingProduct.category}
                      onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                      type="number"
                      placeholder="Price (RWF)"
                      value={editingProduct.price}
                      onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })}
                      className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                      type="number"
                      placeholder="Stock"
                      value={editingProduct.stock}
                      onChange={e => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                      className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                      type="text"
                      placeholder="Emoji"
                      value={editingProduct.image}
                      onChange={e => setEditingProduct({ ...editingProduct, image: e.target.value })}
                      className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="flex space-x-3 mt-4">
                    <button
                      onClick={saveEditProduct}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={cancelEditProduct}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Customers (Boss only) */}
        {activeTab === 'customers' && currentUser.role === 'boss' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">👥 Customer Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {customers.map(customer => (
                <div key={customer.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl text-white">👤</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">{customer.name}</h3>
                    <p className="text-gray-600">{customer.phone}</p>
                    <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Purchases</p>
                      <p className="text-xl font-bold text-orange-600">{customer.totalPurchases.toLocaleString()} RWF</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reports */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">📊 Sales Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">{
                      currentUser.role === 'sales' ? 'My Revenue' :
                      currentUser.role === 'manager' ? 'Manager Revenue' :
                      'Total Revenue'
                    }</p>
                    <p className="text-3xl font-bold">{
                      currentUser.role === 'sales'
                        ? mySales.reduce((sum, sale) => sum + sale.total, 0).toLocaleString()
                        : currentUser.role === 'manager'
                          ? sales.filter(sale => users.find(u => u.id === sale.soldById && u.role === 'manager')).reduce((sum, sale) => sum + sale.total, 0).toLocaleString()
                          : sales.reduce((sum, sale) => sum + sale.total, 0).toLocaleString()
                    } RWF</p>
                  </div>
                  <DollarSign className="w-12 h-12 text-green-200" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">{
                      currentUser.role === 'sales' ? 'My Sales' :
                      currentUser.role === 'manager' ? 'Manager Sales' :
                      'Total Sales'
                    }</p>
                    <p className="text-3xl font-bold">{
                      currentUser.role === 'sales'
                        ? mySales.length
                        : currentUser.role === 'manager'
                          ? sales.filter(sale => users.find(u => u.id === sale.soldById && u.role === 'manager')).length
                          : sales.length
                    }</p>
                  </div>
                  <ShoppingCart className="w-12 h-12 text-blue-200" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Products</p>
                    <p className="text-3xl font-bold">{products.length}</p>
                  </div>
                  <Package className="w-12 h-12 text-purple-200" />
                </div>
              </div>
            </div>
            {/* Sales Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">{
                  currentUser.role === 'sales' ? 'My Sales' :
                  currentUser.role === 'manager' ? 'Manager Sales' :
                  'Recent Sales'
                }</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      {currentUser.role === 'boss' && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold By</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(currentUser.role === 'sales'
                      ? mySales
                      : currentUser.role === 'manager'
                        ? sales.filter(sale => users.find(u => u.id === sale.soldById && u.role === 'manager'))
                        : sales
                    ).map(sale => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{sale.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{sale.customer}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{sale.items}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-green-600">{sale.total.toLocaleString()} RWF</td>
                        {currentUser.role === 'boss' && (
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">{sale.soldBy}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Daily Sales Breakdown */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Daily Sales Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                {(() => {
                  // Group sales by date
                  const salesByDate = {};
                  sales.forEach(sale => {
                    if (!salesByDate[sale.date]) salesByDate[sale.date] = [];
                    salesByDate[sale.date].push(sale);
                  });
                  const dates = Object.keys(salesByDate).sort((a, b) => b.localeCompare(a));
                  return dates.length === 0 ? (
                    <div className="p-6 text-gray-500">No sales data available.</div>
                  ) : (
                    dates.map(date => {
                      const daySales = salesByDate[date];
                      const totalDayAmount = daySales.reduce((sum, s) => sum + s.total, 0);
                      // Aggregate product sales for the day
                      const productMap = {};
                      daySales.forEach(sale => {
                        if (sale.itemsDetail) {
                          sale.itemsDetail.forEach(item => {
                            if (!productMap[item.name]) {
                              productMap[item.name] = { ...item, quantity: 0, total: 0 };
                            }
                            productMap[item.name].quantity += item.quantity;
                            productMap[item.name].total += item.price * item.quantity;
                          });
                        }
                      });
                      const productsSold = Object.values(productMap);
                      return (
                        <div key={date} className="border-b last:border-b-0">
                          <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
                            <span className="font-semibold text-gray-700">{date}</span>
                            <span className="font-bold text-green-700">Total: {totalDayAmount.toLocaleString()} RWF</span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr>
                                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity Sold</th>
                                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {productsSold.length === 0 ? (
                                  <tr><td colSpan="3" className="px-6 py-3 text-gray-400">No product details</td></tr>
                                ) : (
                                  productsSold.map(prod => (
                                    <tr key={prod.name}>
                                      <td className="px-6 py-3 whitespace-nowrap">{prod.name}</td>
                                      <td className="px-6 py-3 whitespace-nowrap">{prod.quantity}</td>
                                      <td className="px-6 py-3 whitespace-nowrap">{prod.total.toLocaleString()} RWF</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Settings (Boss only) */}
        {activeTab === 'settings' && currentUser.role === 'boss' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">⚙️ Settings</h2>
            
            {/* Password Change Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">🔐 Change Password</h3>
                <button
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center space-x-2"
                >
                  <Key className="w-4 h-4" />
                  <span>{showPasswordChange ? 'Cancel' : 'Change Password'}</span>
                </button>
              </div>
              
              {showPasswordChange && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <input
                        type={showPassword.current ? "text" : "password"}
                        placeholder="Current Password"
                        value={passwordChange.currentPassword}
                        onChange={(e) => setPasswordChange({...passwordChange, currentPassword: e.target.value})}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => ({...p, current: !p.current}))}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 focus:outline-none"
                        tabIndex={-1}
                        aria-label={showPassword.current ? 'Hide password' : 'Show password'}
                        style={{background: 'none', border: 'none', padding: 0, margin: 0, position: 'absolute'}}
                      >
                        {showPassword.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword.new ? "text" : "password"}
                        placeholder="New Password"
                        value={passwordChange.newPassword}
                        onChange={(e) => setPasswordChange({...passwordChange, newPassword: e.target.value})}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => ({...p, new: !p.new}))}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 focus:outline-none"
                        tabIndex={-1}
                        aria-label={showPassword.new ? 'Hide password' : 'Show password'}
                        style={{background: 'none', border: 'none', padding: 0, margin: 0, position: 'absolute'}}
                      >
                        {showPassword.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword.confirm ? "text" : "password"}
                        placeholder="Confirm New Password"
                        value={passwordChange.confirmPassword}
                        onChange={(e) => setPasswordChange({...passwordChange, confirmPassword: e.target.value})}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => ({...p, confirm: !p.confirm}))}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 focus:outline-none"
                        tabIndex={-1}
                        aria-label={showPassword.confirm ? 'Hide password' : 'Show password'}
                        style={{background: 'none', border: 'none', padding: 0, margin: 0, position: 'absolute'}}
                      >
                        {showPassword.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={changePassword}
                    className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
                  >
                    Update Password
                  </button>
                </div>
              )}
            </div>
            
            {/* System Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 System Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-600 font-semibold">Total Products</p>
                  <p className="text-2xl font-bold text-blue-800">{products.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-600 font-semibold">Active Users</p>
                  <p className="text-2xl font-bold text-green-800">{users.filter(u => u.active).length}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-orange-600 font-semibold">Total Sales</p>
                  <p className="text-2xl font-bold text-orange-800">{sales.length}</p>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">⚡ Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setGlobalSearch('');
                    setActiveTab('inventory');
                  }}
                  className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 text-left"
                >
                  <Package className="w-6 h-6 mb-2" />
                  <p className="font-semibold">Manage Inventory</p>
                  <p className="text-sm opacity-90">Add, edit, or remove products</p>
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className="bg-purple-500 text-white p-4 rounded-lg hover:bg-purple-600 text-left"
                >
                  <UserPlus className="w-6 h-6 mb-2" />
                  <p className="font-semibold">Manage Staff</p>
                  <p className="text-sm opacity-90">Add or remove sales persons</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Management (Boss only) */}
        {activeTab === 'users' && currentUser.role === 'boss' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">👥 User Management</h2>
              <button
                onClick={() => setShowAddUser(!showAddUser)}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add User</span>
              </button>
            </div>
            {showAddUser && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Add New User</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input
                    type="text"
                    placeholder="Username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="sales">Sales Person</option>
                    <option value="manager">Manager</option>
                    <option value="boss">Boss</option>
                  </select>
                </div>
                <div className="flex space-x-3 mt-4">
                  <button
                    onClick={addUser}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                  >
                    Add User
                  </button>
                  <button
                    onClick={() => setShowAddUser(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{user.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            user.role === 'boss' ? 'bg-yellow-100 text-yellow-800' :
                            user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleUserStatus(user.id)}
                              className={`px-3 py-1 rounded text-xs font-semibold transition-all flex items-center space-x-1 ${
                                user.active ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'
                              }`}
                              title={user.active ? 'Deactivate User' : 'Activate User'}
                            >
                              {user.active ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                              <span>{user.active ? 'Deactivate' : 'Activate'}</span>
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ productId: user.id, productName: user.name })}
                              className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 flex items-center"
                              title="Delete User"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Delete Confirmation Modal */}
            {deleteConfirm.productId && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
                  <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
                  <p className="text-gray-700 mb-6">
                    Are you sure you want to delete the user <strong>{deleteConfirm.productName}</strong>? This action cannot be undone.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setUsers(users.filter(user => user.id !== deleteConfirm.productId));
                        setDeleteConfirm({ productId: null, productName: '' });
                        alert('User deleted successfully!');
                      }}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 w-full"
                    >
                      Delete User
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ productId: null, productName: '' })}
                      className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 w-full"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlimentationShop;
