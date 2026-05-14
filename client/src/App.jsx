import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API = '/api';

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price);
};

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [config, setConfig] = useState(null);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get(`${API}/auth/me`)
        .then(res => setUser(res.data.usuario))
        .catch(() => logout());
    }
    axios.get(`${API}/config`).then(res => setConfig(res.data)).catch(console.error);
  }, [token]);

  const login = (token, usuario) => {
    localStorage.setItem('token', token);
    setToken(token);
    setUser(usuario);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const recargarConfig = () => {
    axios.get(`${API}/config`).then(res => setConfig(res.data)).catch(console.error);
  };

  return (
    <BrowserRouter>
      <div className="app">
        <Navbar user={user} logout={logout} config={config} />
        <Routes>
          <Route path="/" element={<LandingPage user={user} config={config} login={login} />} />
          <Route path="/login" element={<LoginPage onLogin={login} />} />
          <Route path="/admin" element={<AdminLayout user={user} />}>
            <Route index element={<Dashboard />} />
            <Route path="productos" element={<ProductosAdmin />} />
            <Route path="categorias" element={<CategoriasAdmin />} />
            <Route path="descuentos" element={<DescuentosAdmin />} />
            <Route path="slides" element={<SlidesAdmin />} />
            <Route path="contenido" element={<ContenidoAdmin />} />
            <Route path="config" element={<ConfigAdmin onSave={recargarConfig} />} />
          </Route>
          <Route path="/usuario/:id" element={<UsuarioPanel user={user} />} />
          <Route path="/nosotros" element={<AboutUs config={config} />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

function Navbar({ user, logout, config }) {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">{config?.nombre_tienda || 'Coil'}</Link>
      <div className="navbar-links">
        <Link to="/" className="nav-link">Tienda</Link>
        <Link to="/nosotros" className="nav-link">Nosotros</Link>
        {user?.rol === 'admin' && <Link to="/admin" className="nav-link">Admin</Link>}
        {user && user.rol !== 'admin' && <Link to={`/usuario/${user.id}`} className="nav-link">Mis Compras</Link>}
        {user ? (
          <button onClick={logout} className="btn btn-secondary">Salir</button>
        ) : (
          <Link to="/login" className="btn btn-primary">Login</Link>
        )}
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <p className="footer-logo">Dara Maison</p>
      <p style={{ fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase' }}>Tu identidad es tu espectáculo</p>
      <p style={{ marginTop: '1rem', fontSize: '0.75rem' }}>© 2026 Todos los derechos reservados</p>
    </footer>
  );
}

function LandingPage({ user, config, login }) {
  const [productos, setProductos] = useState([]);
  const [contenidos, setContenidos] = useState([]);
  const [slides, setSlides] = useState([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [cupon, setCupon] = useState('');
  const [cuponAplicado, setCuponAplicado] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [showRegister, setShowRegister] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (config?.titulo_pagina) {
      document.title = config.titulo_pagina;
    }
  }, [config]);

  useEffect(() => {
    if (slides.length > 1) {
      const timer = setInterval(() => {
        setSlideIndex(prev => (prev + 1) % slides.length);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [slides]);

  const loadData = async () => {
    try {
      const [prodRes, contRes, slidesRes] = await Promise.all([
        axios.get(`${API}/productos`),
        axios.get(`${API}/contenidos`),
        axios.get(`${API}/slides`)
      ]);
      setProductos(prodRes.data);
      setContenidos(contRes.data);
      setSlides(slidesRes.data);
    } catch (e) { console.error(e); }
  };

  const agregarAlCarrito = (producto) => {
    const existente = carrito.find(p => p.id === producto.id);
    if (existente) {
      setCarrito(carrito.map(p => p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p));
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  };

  const quitarDelCarrito = (productoId) => {
    const item = carrito.find(p => p.id === productoId);
    if (item.cantidad > 1) {
      setCarrito(carrito.map(p => p.id === productoId ? { ...p, cantidad: p.cantidad - 1 } : p));
    } else {
      setCarrito(carrito.filter(p => p.id !== productoId));
    }
  };

  const obtenerTotalConDescuentos = () => {
    let total = 0;
    let descuentoTotal = cuponAplicado?.descuento || 0;
    
    for (const item of carrito) {
      let descuento = 0;
      if (item.Categoria?.descuento_porcentaje) descuento = item.Categoria.descuento_porcentaje;
      const descProd = item.DescuentoProductos?.[0];
      if (descProd?.descuento_porcentaje > descuento) descuento = descProd.descuento_porcentaje;
      
      const precio = parseFloat(item.precio);
      const precioConDescuento = precio * (1 - descuento / 100);
      total += precioConDescuento * item.cantidad;
    }
    
    const descuentoMonto = total * (descuentoTotal / 100);
    return total - descuentoMonto;
  };

  const aplicarCupon = async () => {
    if (!user) {
      setShowRegister(true);
      return;
    }
    try {
      const res = await axios.post(`${API}/cupones/validar`, { codigo: cupon, usuario_id: user.id });
      setCuponAplicado(res.data);
    } catch (e) {
      alert(e.response?.data?.error || 'Cupón no válido');
    }
  };

  const comprar = async () => {
    if (!user) {
      setShowRegister(true);
      return;
    }
    if (carrito.length === 0) {
      alert('Carrito vacío');
      return;
    }
    const waNumber = config?.whatsapp_number || '521XXXXXXXXXX';
    const total = obtenerTotalConDescuentos();
    const itemsTexto = carrito.map(p => `${p.nombre} x${p.cantidad}`).join(', ');
    const mensaje = `Hola, quiero comprar: ${itemsTexto}. Total: ${formatPrice(total)}`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(mensaje)}`, '_blank');
    
    await axios.post(`${API}/pedidos`, {
      items: carrito.map(p => ({ producto_id: p.id, cantidad: p.cantidad })),
      cupon_codigo: cuponAplicado?.codigo
    });
    
    if (cuponAplicado && user) {
      await axios.put(`${API}/cupones/${cuponAplicado.codigo}`, { activo: false, usado_por: user.id });
    }
    
    setCarrito([]);
    setCupon('');
    setCuponAplicado(null);
  };

  const getPrecio = (producto) => {
    let descuento = 0;
    if (producto.Categoria?.descuento_porcentaje) descuento = producto.Categoria.descuento_porcentaje;
    const descProd = producto.DescuentoProductos?.[0];
    if (descProd?.descuento_porcentaje > descuento) descuento = descProd.descuento_porcentaje;
    const precio = parseFloat(producto.precio);
    return { precio: precio * (1 - descuento / 100), descuento, original: precio };
  };

  const youtubeVideos = contenidos.filter(c => c.tipo === 'youtube').slice(0, 4);
  const tiktokVideos = contenidos.filter(c => c.tipo === 'tiktok');
  const instagramVideos = contenidos.filter(c => c.tipo === 'instagram');

  return (
    <div className="main">
      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} onLogin={login} />}
      
      {slides.length > 0 ? (
        <div className="slider-container">
          {slides.map((slide, i) => (
            <div key={slide.id} className={`slide ${i === slideIndex ? 'active' : ''}`}>
              <img src={slide.imagen_url} alt={slide.titulo || ''} className="slide-image" />
              {(slide.titulo || slide.subtitulo) && (
                <div className="slide-overlay">
                  {slide.titulo && <h1 className="slide-title">{slide.titulo}</h1>}
                  {slide.subtitulo && <p className="slide-subtitle">{slide.subtitulo}</p>}
                </div>
              )}
            </div>
          ))}
          {slides.length > 1 && (
            <>
              <button className="slide-arrow slide-prev" onClick={() => setSlideIndex(prev => (prev - 1 + slides.length) % slides.length)}>‹</button>
              <button className="slide-arrow slide-next" onClick={() => setSlideIndex(prev => (prev + 1) % slides.length)}>›</button>
              <div className="slide-dots">
                {slides.map((_, i) => (
                  <span key={i} className={`slide-dot ${i === slideIndex ? 'active' : ''}`} onClick={() => setSlideIndex(i)} />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <section className="hero-static">
          <h1 className="titulo-animado">
            {config?.bienvenido_texto || 'Dara Maison'}
            <span className="cursor">|</span>
          </h1>
          <p className="hero-subtitle">{config?.descripcion || 'No vendemos productos; transformamos el aura de los grandes íconos musicales en experiencias tangibles de alta actitud.'}</p>
        </section>
      )}

      <div className="cupon-aplicar">
        <input 
          type="text" 
          className="cupon-input"
          placeholder="Aplicar cupón de descuento"
          value={cupon}
          onChange={e => setCupon(e.target.value)}
        />
        <button className="btn btn-primary" onClick={aplicarCupon}>Aplicar</button>
      </div>
      {cuponAplicado && (
        <p style={{ color: 'var(--success)', marginBottom: '1rem' }}>
          ✓ Cupón aplicado: {cuponAplicado.descuento}% descuento
        </p>
      )}

      <div className="productos-grid">
        {productos.map(producto => {
          const { precio, descuento } = getPrecio(producto);
          return (
            <div key={producto.id} className="producto-card">
              <img src={producto.imagen_url || '/placeholder.svg'} alt={producto.nombre} className="producto-imagen" />
              <div className="producto-info">
                <h3 className="producto-nombre">{producto.nombre}</h3>
                <p className="producto-titulo">{producto.titulo}</p>
                <p className="producto-descripcion">{producto.descripcion}</p>
                <div>
                  <span className="producto-precio">{formatPrice(precio)}</span>
                  {descuento > 0 && (
                    <>
                      <span className="producto-precio-descuento">{formatPrice(parseFloat(producto.precio))}</span>
                      <span className="badge badge-descuento">-{descuento}%</span>
                    </>
                  )}
                </div>
                <button className="btn btn-primary" onClick={() => agregarAlCarrito(producto)}>
                  Agregar al Carrito
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {carrito.length > 0 && (
        <div className="carrito-section">
          <h2>Carrito de Compras</h2>
          <div className="carrito-items">
            {carrito.map(item => {
              const { precio, descuento } = getPrecio(item);
              return (
                <div key={item.id} className="carrito-item">
                  <div className="carrito-item-info">
                    <h4>{item.nombre}</h4>
                    <p>{formatPrice(precio)} x {item.cantidad}</p>
                  </div>
                  <div className="carrito-item-acciones">
                    <button onClick={() => quitarDelCarrito(item.id)}>-</button>
                    <span>{item.cantidad}</span>
                    <button onClick={() => agregarAlCarrito(item)}>+</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="carrito-total">
            <h3>Total: {formatPrice(obtenerTotalConDescuentos())}</h3>
            {cuponAplicado && <p className="badge badge-descuento">Cupón {cuponAplicado.descuento}% aplicado</p>}
            <button className="btn btn-primary" onClick={comprar}>
              Comprar por WhatsApp
            </button>
          </div>
        </div>
      )}

      {youtubeVideos.length > 0 && (
        <section className="videos-section">
          <h2>YouTube</h2>
          <div className="video-grid">
            {youtubeVideos.map(c => (
              <VideoEmbed key={c.id} contenido={c} />
            ))}
          </div>
        </section>
      )}

      {tiktokVideos.length > 0 && (
        <section className="videos-section">
          <h2>TikTok</h2>
          <div className="video-grid tiktok-grid">
            {tiktokVideos.map(c => (
              <VideoEmbed key={c.id} contenido={c} />
            ))}
          </div>
        </section>
      )}

      {instagramVideos.length > 0 && (
        <section className="videos-section">
          <h2>Instagram</h2>
          <div className="video-grid instagram-grid">
            {instagramVideos.map(c => (
              <VideoEmbed key={c.id} contenido={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function VideoEmbed({ contenido }) {
  const getEmbedUrl = () => {
    const url = contenido.url;
    if (contenido.tipo === 'youtube') {
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
      return match ? `https://www.youtube.com/embed/${match[1]}` : url;
    }
    if (contenido.tipo === 'tiktok') {
      const videoId = url.match(/video\/(\d+)/);
      if (videoId) return `https://www.tiktok.com/embed/v2/${videoId[1]}`;
      return url;
    }
    return url;
  };

  if (contenido.tipo === 'instagram' || contenido.tipo === 'tiktok') {
    const isTiktok = contenido.tipo === 'tiktok';
    return (
      <a href={contenido.url} target="_blank" rel="noopener noreferrer" className="video-embed" style={{ display: 'block', padding: '2rem', background: 'var(--surface)', borderRadius: '12px', textAlign: 'center' }}>
        {isTiktok ? (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.86 1.48 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.08A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.14z" stroke="#00F2EA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="20" height="20" rx="5" stroke="#E1306C" strokeWidth="2"/>
            <circle cx="12" cy="12" r="4" stroke="#E1306C" strokeWidth="2"/>
            <circle cx="18" cy="6" r="1" fill="#E1306C"/>
          </svg>
        )}
        <span style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text)' }}>Ver en {isTiktok ? 'TikTok' : 'Instagram'} ↗</span>
      </a>
    );
  }

  return (
    <div className="video-embed">
      <iframe
        src={getEmbedUrl()}
        className="contenido-video youtube"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function RegisterModal({ onClose, onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', password: '' });
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await axios.post(`${API}/auth/login`, { email: form.email, password: form.password });
        onLogin(res.data.token, res.data.usuario);
      } else {
        const res = await axios.post(`${API}/auth/register`, form);
        onLogin(res.data.token, res.data.usuario);
      }
      onClose();
    } catch (e) {
      alert(e.response?.data?.error || 'Error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="register-tabs">
          <button className={`register-tab ${isLogin ? 'active' : ''}`} onClick={() => setIsLogin(true)}>Login</button>
          <button className={`register-tab ${!isLogin ? 'active' : ''}`} onClick={() => setIsLogin(false)}>Registro</button>
        </div>
        <form onSubmit={submit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input className="form-input" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input className="form-input" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} required />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input type="password" className="form-input" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          </div>
          <button type="submit" className="btn btn-primary">{isLogin ? 'Entrar' : 'Registrarse'}</button>
        </form>
      </div>
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', password: '' });
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await axios.post(`${API}/auth/login`, { email: form.email, password: form.password });
        onLogin(res.data.token, res.data.usuario);
        navigate(res.data.usuario.rol === 'admin' ? '/admin' : '/');
      } else {
        const res = await axios.post(`${API}/auth/register`, form);
        onLogin(res.data.token, res.data.usuario);
        navigate('/');
      }
    } catch (e) {
      alert(e.response?.data?.error || 'Error');
    }
  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={submit}>
        <h1 className="login-title">{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</h1>
        <div className="register-tabs">
          <button type="button" className={`register-tab ${isLogin ? 'active' : ''}`} onClick={() => setIsLogin(true)}>Login</button>
          <button type="button" className={`register-tab ${!isLogin ? 'active' : ''}`} onClick={() => setIsLogin(false)}>Registro</button>
        </div>
        {!isLogin && (
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input className="form-input" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required />
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Email</label>
          <input type="email" className="form-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
        </div>
        {!isLogin && (
          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input className="form-input" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} required />
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Contraseña</label>
          <input type="password" className="form-input" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
        </div>
        <button type="submit" className="btn btn-primary">{isLogin ? 'Entrar' : 'Registrarse'}</button>
      </form>
    </div>
  );
}

function AdminLayout({ user }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.rol !== 'admin') navigate('/login');
  }, [user]);

  if (!user || user.rol !== 'admin') return null;

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <h2 className="sidebar-title">Admin Panel</h2>
        <nav className="sidebar-nav">
          <Link to="/admin" className={`sidebar-link ${location.pathname === '/admin' ? 'active' : ''}`}>Dashboard</Link>
          <Link to="/admin/productos" className={`sidebar-link ${location.pathname.includes('productos') ? 'active' : ''}`}>Productos</Link>
          <Link to="/admin/categorias" className={`sidebar-link ${location.pathname.includes('categorias') ? 'active' : ''}`}>Categorías</Link>
          <Link to="/admin/descuentos" className={`sidebar-link ${location.pathname.includes('descuentos') ? 'active' : ''}`}>Descuentos</Link>
          <Link to="/admin/slides" className={`sidebar-link ${location.pathname.includes('slides') ? 'active' : ''}`}>Slides</Link>
          <Link to="/admin/contenido" className={`sidebar-link ${location.pathname.includes('contenido') ? 'active' : ''}`}>Contenido</Link>
          <Link to="/admin/config" className={`sidebar-link ${location.pathname.includes('config') ? 'active' : ''}`}>Configuración</Link>
        </nav>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}

function Dashboard() {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    axios.get(`${API}/pedidos`).then(res => setPedidos(res.data)).catch(console.error);
  }, []);

  const stats = {
    total: pedidos.length,
    proceso: pedidos.filter(p => p.estado === 'proceso').length,
    aprobados: pedidos.filter(p => p.estado === 'aprobado').length,
    enviados: pedidos.filter(p => p.estado === 'enviado').length,
    entregados: pedidos.filter(p => p.estado === 'entregado').length,
    rechazados: pedidos.filter(p => p.estado === 'rechazado').length
  };

  const cambiarEstado = async (id, estado) => {
    try {
      await axios.put(`${API}/pedidos/${id}`, { estado });
      setPedidos(pedidos.map(p => p.id === id ? { ...p, estado } : p));
    } catch (e) {
      alert('Error al cambiar estado');
    }
  };

  return (
    <div>
      <h1 className="admin-title">Dashboard</h1>
      <div className="productos-grid" style={{ marginBottom: '2rem' }}>
        <div className="pedido-card"><h3>Total Pedidos</h3><p style={{ fontSize: '2rem' }}>{stats.total}</p></div>
        <div className="pedido-card"><h3>En Proceso</h3><p style={{ fontSize: '2rem', color: '#fbbf24' }}>{stats.proceso}</p></div>
        <div className="pedido-card"><h3>Aprobados</h3><p style={{ fontSize: '2rem', color: '#3b82f6' }}>{stats.aprobados}</p></div>
        <div className="pedido-card"><h3>Enviados</h3><p style={{ fontSize: '2rem', color: '#8b5cf6' }}>{stats.enviados}</p></div>
        <div className="pedido-card"><h3>Entregados</h3><p style={{ fontSize: '2rem', color: 'var(--success)' }}>{stats.entregados}</p></div>
        <div className="pedido-card"><h3>Rechazados</h3><p style={{ fontSize: '2rem', color: 'var(--error)' }}>{stats.rechazados}</p></div>
      </div>
      <h2>Todos los Pedidos</h2>
      <table className="table">
        <thead>
          <tr><th>ID</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Fecha</th><th>Cambiar</th></tr>
        </thead>
        <tbody>
          {pedidos.map(p => (
            <tr key={p.id}>
              <td>{p.id.slice(0, 8)}</td>
              <td>{p.Usuario?.nombre}</td>
              <td>{formatPrice(p.total)}</td>
              <td><span className={`pedido-estado ${p.estado}`}>{p.estado}</span></td>
              <td>{new Date(p.createdAt).toLocaleDateString()}</td>
              <td>
                <select 
                  className="form-select" 
                  style={{ width: '130px' }}
                  value={p.estado}
                  onChange={e => cambiarEstado(p.id, e.target.value)}
                >
                  <option value="proceso">Proceso</option>
                  <option value="aprobado">Aprobado</option>
                  <option value="enviado">Enviado</option>
                  <option value="entregado">Entregado</option>
                  <option value="rechazado">Rechazado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductosAdmin() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: '', titulo: '', descripcion: '', precio: '', categoria_id: '' });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    console.log('Cargando datos...');
    try {
      const [p, c] = await Promise.all([
        axios.get(`${API}/productos`),
        axios.get(`${API}/categorias`)
      ]);
      console.log('Productos:', p.data.length, 'Categorias:', c.data.length, c.data);
      setProductos(p.data);
      setCategorias(c.data);
    } catch (e) {
      console.error('Error cargando:', e);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(form).forEach(k => data.append(k, form[k]));
    if (editando) {
      await axios.put(`${API}/productos/${editando}`, data);
    } else {
      await axios.post(`${API}/productos`, data);
    }
    setShowModal(false);
    setEditando(null);
    setForm({ nombre: '', titulo: '', descripcion: '', precio: '', categoria_id: '' });
    load();
  };

  const eliminar = async (id) => {
    if (confirm('¿Eliminar?')) {
      await axios.delete(`${API}/productos/${id}`);
      load();
    }
  };

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">Productos</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nuevo Producto</button>
      </div>
      <table className="table">
        <thead><tr><th>Nombre</th><th>Precio</th><th>Categoría</th><th>Acciones</th></tr></thead>
        <tbody>
          {productos.map(p => (
            <tr key={p.id}>
              <td>{p.nombre}</td>
              <td>${p.precio}</td>
              <td>{p.Categorium?.nombre}</td>
              <td>
                <button className="btn btn-secondary" onClick={() => { setEditando(p.id); setForm(p); setShowModal(true); }}>Editar</button>
                <button className="btn btn-danger" onClick={() => eliminar(p.id)} style={{ marginLeft: '0.5rem' }}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editando ? 'Editar' : 'Nuevo'} Producto</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input className="form-input" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Título</label>
                <input className="form-input" value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea className="form-textarea" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Precio *</label>
                <input type="number" min="0" max="999999" step="1" className="form-input" value={form.precio} onChange={e => setForm({...form, precio: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select className="form-select" value={form.categoria_id} onChange={e => setForm({...form, categoria_id: e.target.value})}>
                  <option value="">Seleccionar</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Imagen</label>
                <input type="file" className="form-input" onChange={e => setForm({...form, imagen: e.target.files[0]})} />
              </div>
              <button type="submit" className="btn btn-primary">Guardar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoriasAdmin() {
  const [categorias, setCategorias] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: '', descuento_porcentaje: 0 });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await axios.get(`${API}/categorias`);
    setCategorias(res.data);
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (editando) {
      await axios.put(`${API}/categorias/${editando}`, form);
    } else {
      await axios.post(`${API}/categorias`, form);
    }
    setShowModal(false);
    setEditando(null);
    setForm({ nombre: '', descuento_porcentaje: 0 });
    load();
  };

  const eliminar = async (id) => {
    if (confirm('¿Eliminar categoría?')) {
      await axios.delete(`${API}/categorias/${id}`);
      load();
    }
  };

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">Categorías</h1>
        <button className="btn btn-primary" onClick={() => { setEditando(null); setForm({ nombre: '', descuento_porcentaje: 0 }); setShowModal(true); }}>
          + Nueva Categoría
        </button>
      </div>
      <table className="table">
        <thead><tr><th>Nombre</th><th>Descuento %</th><th>Acciones</th></tr></thead>
        <tbody>
          {categorias.map(c => (
            <tr key={c.id}>
              <td>{c.nombre}</td>
              <td>{c.descuento_porcentaje}%</td>
              <td>
                <button className="btn btn-secondary" onClick={() => { setEditando(c.id); setForm(c); setShowModal(true); }}>Editar</button>
                <button className="btn btn-danger" onClick={() => eliminar(c.id)} style={{ marginLeft: '0.5rem' }}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editando ? 'Editar' : 'Nueva'} Categoría</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={guardar}>
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input className="form-input" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Descuento %</label>
                <input type="number" className="form-input" value={form.descuento_porcentaje} onChange={e => setForm({...form, descuento_porcentaje: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary">Guardar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DescuentosAdmin() {
  const [cupones, setCupones] = useState([]);
  const [showCupon, setShowCupon] = useState(false);
  const [porcentaje, setPorcentaje] = useState(10);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await axios.get(`${API}/cupones`);
    setCupones(res.data);
  };

  const generarCupon = async () => {
    await axios.post(`${API}/cupones`, { descuento_porcentaje: porcentaje });
    setShowCupon(false);
    load();
  };

  const eliminarCupon = async (id) => {
    await axios.delete(`${API}/cupones/${id}`);
    load();
  };

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">Cupones de Descuento</h1>
        <button className="btn btn-primary" onClick={() => setShowCupon(true)}>Generar Cupón</button>
      </div>
      <table className="table">
        <thead><tr><th>Código</th><th>Descuento</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
          {cupones.map(cup => (
            <tr key={cup.id}>
              <td>{cup.codigo}</td>
              <td>{cup.descuento_porcentaje}%</td>
              <td>{cup.activo ? 'Activo' : 'Inactivo'}</td>
              <td>
                <button className="btn btn-danger" onClick={() => eliminarCupon(cup.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showCupon && (
        <div className="modal-overlay" onClick={() => setShowCupon(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Generar Cupón</h2>
              <button className="modal-close" onClick={() => setShowCupon(false)}>×</button>
            </div>
            <div className="form-group">
              <label className="form-label">Porcentaje de descuento</label>
              <select className="form-select" value={porcentaje} onChange={e => setPorcentaje(e.target.value)}>
                <option value="10">10%</option>
                <option value="20">20%</option>
                <option value="30">30%</option>
                <option value="50">50%</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={generarCupon}>Generar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ContenidoAdmin() {
  const [contenidos, setContenidos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ tipo: 'youtube', url: '', orden: 0 });

  useEffect(() => {
    axios.get(`${API}/contenidos`).then(res => setContenidos(res.data)).catch(console.error);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    await axios.post(`${API}/contenidos`, form);
    setShowModal(false);
    setForm({ tipo: 'youtube', url: '', orden: 0 });
    const res = await axios.get(`${API}/contenidos`);
    setContenidos(res.data);
  };

  const eliminar = async (id) => {
    await axios.delete(`${API}/contenidos/${id}`);
    const res = await axios.get(`${API}/contenidos`);
    setContenidos(res.data);
  };

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">Contenido Multimedia</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Agregar Video</button>
      </div>
      <div className="contenidos-grid">
        {contenidos.map(c => (
          <div key={c.id} className="contenido-card">
            <VideoEmbed contenido={c} />
            <div style={{ padding: '1rem' }}>
              <p>{c.tipo.toUpperCase()}</p>
              <button className="btn btn-danger" onClick={() => eliminar(c.id)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Agregar Video</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select className="form-select" value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
                  <option value="youtube">YouTube</option>
                  <option value="tiktok">TikTok</option>
                  <option value="instagram">Instagram</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">URL del video</label>
                <input className="form-input" value={form.url} onChange={e => setForm({...form, url: e.target.value})} placeholder="https://..." required />
              </div>
              <div className="form-group">
                <label className="form-label">Orden</label>
                <input type="number" className="form-input" value={form.orden} onChange={e => setForm({...form, orden: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary">Guardar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfigAdmin({ onSave }) {
  const [config, setConfig] = useState({});
  const [form, setForm] = useState({});

  useEffect(() => {
    axios.get(`${API}/config`).then(res => {
      setConfig(res.data);
      setForm(res.data);
    }).catch(console.error);
  }, []);

  const guardar = async (e) => {
    e.preventDefault();
    await axios.put(`${API}/config`, form);
    setConfig(form);
    if (onSave) onSave();
    alert('Configuración guardada');
  };

  return (
    <div>
      <h1 className="admin-title">Configuración de la Tienda</h1>
      <form onSubmit={guardar}>
        <div className="form-group">
          <label className="form-label">Nombre de la Tienda</label>
          <input className="form-input" value={form.nombre_tienda || ''} onChange={e => setForm({...form, nombre_tienda: e.target.value})} />
        </div>
        <div className="form-group">
          <label className="form-label">Título de la Página</label>
          <input className="form-input" value={form.titulo_pagina || ''} onChange={e => setForm({...form, titulo_pagina: e.target.value})} />
        </div>
        <div className="form-group">
          <label className="form-label">Descripción</label>
          <textarea className="form-textarea" value={form.descripcion || ''} onChange={e => setForm({...form, descripcion: e.target.value})} />
        </div>
        <div className="form-group">
          <label className="form-label">Texto de Bienvenida</label>
          <input className="form-input" value={form.bienvenido_texto || ''} onChange={e => setForm({...form, bienvenido_texto: e.target.value})} />
        </div>
        <div className="form-group">
          <label className="form-label">Número WhatsApp (con código de país, sin +)</label>
          <input className="form-input" value={form.whatsapp_number || ''} onChange={e => setForm({...form, whatsapp_number: e.target.value})} placeholder="5215551234567" />
        </div>
        <div className="form-group">
          <label className="form-label">Quiénes Somos</label>
          <textarea className="form-textarea" rows="6" value={form.quienes_somos || ''} onChange={e => setForm({...form, quienes_somos: e.target.value})} placeholder="Describe tu marca..." />
        </div>
        <div className="form-group">
          <label className="form-label">Misión</label>
          <textarea className="form-textarea" rows="4" value={form.mision || ''} onChange={e => setForm({...form, mision: e.target.value})} placeholder="Misión de la empresa..." />
        </div>
        <div className="form-group">
          <label className="form-label">Visión</label>
          <textarea className="form-textarea" rows="4" value={form.vision || ''} onChange={e => setForm({...form, vision: e.target.value})} placeholder="Visión de la empresa..." />
        </div>
        <button type="submit" className="btn btn-primary">Guardar Configuración</button>
      </form>
    </div>
  );
}

function SlidesAdmin() {
  const [slides, setSlides] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ titulo: '', subtitulo: '', orden: 0, imagen: null });

  useEffect(() => { load(); }, []);

  const load = async () => {
    const res = await axios.get(`${API}/slides`);
    setSlides(res.data);
  };

  const submit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    if (form.imagen) data.append('imagen', form.imagen);
    if (form.titulo) data.append('titulo', form.titulo);
    if (form.subtitulo) data.append('subtitulo', form.subtitulo);
    data.append('orden', form.orden);
    if (editando) {
      await axios.put(`${API}/slides/${editando}`, data);
    } else {
      await axios.post(`${API}/slides`, data);
    }
    setShowModal(false);
    setEditando(null);
    setForm({ titulo: '', subtitulo: '', orden: 0, imagen: null });
    load();
  };

  const eliminar = async (id) => {
    if (confirm('¿Eliminar slide?')) {
      await axios.delete(`${API}/slides/${id}`);
      load();
    }
  };

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">Slides del Index</h1>
        <button className="btn btn-primary" onClick={() => { setEditando(null); setForm({ titulo: '', subtitulo: '', orden: slides.length, imagen: null }); setShowModal(true); }}>+ Nuevo Slide</button>
      </div>
      <div className="slides-grid">
        {slides.map(s => (
          <div key={s.id} className="slide-card">
            <img src={s.imagen_url} alt={s.titulo} className="slide-card-img" />
            <div className="slide-card-info">
              <h3>{s.titulo}</h3>
              <p>{s.subtitulo}</p>
              <span>Orden: {s.orden}</span>
            </div>
            <div className="slide-card-actions">
              <button className="btn btn-secondary" onClick={() => { setEditando(s.id); setForm({ titulo: s.titulo, subtitulo: s.subtitulo, orden: s.orden, imagen: null }); setShowModal(true); }}>Editar</button>
              <button className="btn btn-danger" onClick={() => eliminar(s.id)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editando ? 'Editar' : 'Nuevo'} Slide</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Título</label>
                <input className="form-input" value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Subtítulo</label>
                <input className="form-input" value={form.subtitulo} onChange={e => setForm({...form, subtitulo: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Orden</label>
                <input type="number" className="form-input" value={form.orden} onChange={e => setForm({...form, orden: parseInt(e.target.value) || 0})} />
              </div>
              <div className="form-group">
                <label className="form-label">Imagen (16:9 recomendado)</label>
                <input type="file" accept="image/*" className="form-input" onChange={e => setForm({...form, imagen: e.target.files[0]})} required={!editando} />
              </div>
              <button type="submit" className="btn btn-primary">{editando ? 'Actualizar' : 'Crear'} Slide</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function UsuarioPanel({ user }) {
  const [pedidos, setPedidos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return navigate('/login');
    axios.get(`${API}/pedidos`).then(res => setPedidos(res.data)).catch(console.error);
  }, [user]);

  if (!user) return null;

  return (
    <div className="main">
      <h1>Mis Compras</h1>
      {pedidos.length === 0 ? (
        <p className="empty-state">No tienes compras aún</p>
      ) : (
        pedidos.map(p => (
          <div key={p.id} className="pedido-card">
            <div className="pedido-header">
              <h3>Pedido #{p.id.slice(0, 8)}</h3>
              <span className={`pedido-estado ${p.estado}`}>{p.estado}</span>
            </div>
            <div className="pedido-items">
              {p.PedidoItems?.map(item => (
                <div key={item.id} className="pedido-item">
                  <span>{item.Producto?.nombre} x{item.cantidad}</span>
                  <span>${item.precio}</span>
                </div>
              ))}
            </div>
            <p><strong>Total: {formatPrice(p.total)}</strong></p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(p.createdAt).toLocaleString()}</p>
          </div>
        ))
      )}
    </div>
  );
}

function AboutUs({ config }) {
  return (
    <div className="about-page">
      <div className="about-hero">
        <div className="about-hero-content">
          <span className="about-badge">Sobre Nosotros</span>
          <h1 className="about-hero-title">{config?.nombre_tienda || 'Dara Maison'}</h1>
          <div className="about-divider"><span></span></div>
        </div>
      </div>

      <div className="about-section">
        <div className="about-card about-card-full">
          <div className="about-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <h2 className="about-card-title">Quiénes Somos</h2>
          <p className="about-card-text">{config?.quienes_somos || 'Somos una marca comprometida con la excelencia y la innovación, dedicada a ofrecer productos y experiencias únicas que transforman la manera en que nuestros clientes se expresan.'}</p>
        </div>
      </div>

      <div className="about-section about-section-split">
        <div className="about-card">
          <div className="about-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </div>
          <h2 className="about-card-title">Misión</h2>
          <p className="about-card-text">{config?.mision || 'Nuestra misión es brindar productos de alta calidad que inspiren y empoderen a las personas, combinando diseño innovador con un servicio excepcional que supere las expectativas de nuestros clientes.'}</p>
        </div>
        <div className="about-card">
          <div className="about-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12h3"/><path d="M19 12h3"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M5.636 5.636l1.414 1.414"/><path d="M16.95 16.95l1.414 1.414"/><path d="M5.636 18.364l1.414-1.414"/><path d="M16.95 7.05l1.414-1.414"/></svg>
          </div>
          <h2 className="about-card-title">Visión</h2>
          <p className="about-card-text">{config?.vision || 'Ser reconocidos como una marca líder que redefine los estándares de calidad y creatividad, creando un impacto positivo y duradero en la vida de las personas y en la industria.'}</p>
        </div>
      </div>
    </div>
  );
}

export default App;