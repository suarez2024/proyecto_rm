// Modelos de datos
class Producto {
    constructor(id, nombre, tipoUnidad, precio, cantidad, cantidadOriginal) {
        this.id = id;
        this.nombre = nombre;
        this.tipoUnidad = tipoUnidad;
        this.precio = precio;
        this.cantidad = cantidad;
        this.cantidadOriginal = cantidadOriginal || cantidad;
    }
}

class Pedido {
    constructor(id) {
        this.id = id;
        this.fecha = new Date().toLocaleString();
        this.items = [];
        this.total = 0;
    }

    agregarItem(producto, cantidad) {
        const subtotal = producto.precio * cantidad;
        this.items.push({
            producto: producto,
            cantidad: cantidad,
            subtotal: subtotal
        });
        this.total += subtotal;
    }
}

// Gestión de localStorage
const Storage = {
    getProductos: () => {
        const productos = localStorage.getItem('productos');
        return productos ? JSON.parse(productos) : [];
    },
    setProductos: (productos) => {
        localStorage.setItem('productos', JSON.stringify(productos));
    },
    getPedidos: () => {
        const pedidos = localStorage.getItem('pedidos');
        return pedidos ? JSON.parse(pedidos) : [];
    },
    setPedidos: (pedidos) => {
        localStorage.setItem('pedidos', JSON.stringify(pedidos));
    },
    getEstadisticas: () => {
        const stats = localStorage.getItem('estadisticas');
        return stats ? JSON.parse(stats) : {
            productosVendidos: {},
            ingresosTotales: 0,
            totalPedidos: 0
        };
    },
    setEstadisticas: (estadisticas) => {
        localStorage.setItem('estadisticas', JSON.stringify(estadisticas));
    }
};

// Estado de la aplicación
let productos = Storage.getProductos();
let pedidos = Storage.getPedidos();
let estadisticas = Storage.getEstadisticas();
let pedidoActual = new Pedido(generarId());

// Utilidades
function generarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function mostrarAlerta(mensaje, tipo = 'success') {
    const alert = document.getElementById('alert');
    alert.textContent = mensaje;
    alert.className = `alert alert-${tipo}`;
    alert.style.display = 'block';

    setTimeout(() => {
        alert.style.display = 'none';
    }, 3000);
}

function formatearMoneda(valor) {
    return `${parseFloat(valor).toFixed(2)} CUP`;
}

function acortarTexto(texto, maxLength = 15) {
    if (texto.length <= maxLength) return texto;
    return texto.substring(0, maxLength) + '...';
}

function calcularPorcentajeStock(actual, original) {
    if (original === 0) return 0;
    return (actual / original) * 100;
}

function obtenerClaseStock(porcentaje) {
    if (porcentaje >= 60) return 'stock-high';
    if (porcentaje >= 30) return 'stock-medium';
    return 'stock-low';
}

// Gestión de productos
function agregarProducto(nombre, tipoUnidad, precio, cantidad) {
    const nuevoProducto = new Producto(
        generarId(),
        nombre,
        tipoUnidad,
        parseFloat(precio),
        parseFloat(cantidad),
        parseFloat(cantidad)
    );

    productos.push(nuevoProducto);
    Storage.setProductos(productos);
    mostrarAlerta('Producto añadido');
    cargarProductos();
    cargarSelectProductos();
    actualizarEstadisticas();
    cerrarModal('modal-producto');
}

function eliminarProducto(id) {
    if (confirm('¿Está seguro de que desea eliminar este producto?')) {
        productos = productos.filter(p => p.id !== id);
        Storage.setProductos(productos);
        mostrarAlerta('Producto eliminado');
        cargarProductos();
        cargarSelectProductos();
        actualizarEstadisticas();
    }
}

function cargarProductos() {
    const tbody = document.getElementById('lista-productos');
    const emptyState = document.getElementById('empty-products');
    
    if (productos.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    tbody.innerHTML = productos.map(producto => `
        <tr data-product-id="${producto.id}">
            <td class="product-name text-truncate" title="${producto.nombre}">${acortarTexto(producto.nombre, 12)}</td>
            <td class="text-sm">${producto.tipoUnidad === 'unidades' ? 'U' : 'Lb'}</td>
            <td class="text-sm">${parseFloat(producto.precio).toFixed(0)}</td>
            <td class="hide-on-mobile text-sm">${producto.cantidad}</td>
            <td class="actions">
                <button class="btn btn-warning btn-icon btn-edit" title="Editar">
                    <svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button class="btn btn-danger btn-icon btn-delete" title="Eliminar">
                    <svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </td>
        </tr>
    `).join('');
    
    // Agregar event listeners para los botones de edición y eliminación
    agregarEventListenersProductos();
}

function agregarEventListenersProductos() {
    // Botones de edición
    document.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.closest('tr').getAttribute('data-product-id');
            editarProducto(productId);
        });
    });
    
    // Botones de eliminación
    document.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.closest('tr').getAttribute('data-product-id');
            eliminarProducto(productId);
        });
    });
}

function cargarSelectProductos() {
    const select = document.getElementById('producto-pedido');
    select.innerHTML = '<option value="">Seleccione...</option>' +
        productos.map(producto =>
            `<option value="${producto.id}">${acortarTexto(producto.nombre, 20)} - ${parseFloat(producto.precio).toFixed(0)}/${producto.tipoUnidad === 'unidades' ? 'U' : 'Lb'}</option>`
        ).join('');
}

// Funciones de edición de productos
function editarProducto(id) {
    console.log("producto a editar: ", id);
    const producto = productos.find(p => p.id === id);
    if (!producto) return;

    // Llenar el formulario con los datos actuales
    document.getElementById('edit-nombre').value = producto.nombre;
    document.getElementById('edit-tipo-unidad').value = producto.tipoUnidad;
    document.getElementById('edit-precio').value = producto.precio;
    document.getElementById('edit-cantidad').value = producto.cantidad;
    document.getElementById('edit-cantidad-original').value = producto.cantidadOriginal;

    // Guardar el ID del producto que estamos editando
    document.getElementById('modal-editar-producto').dataset.productId = id;

    abrirModal('modal-editar-producto');
}

function guardarEdicionProducto() {
    const id = document.getElementById('modal-editar-producto').dataset.productId;
    const nombre = document.getElementById('edit-nombre').value;
    const tipoUnidad = document.getElementById('edit-tipo-unidad').value;
    const precio = parseFloat(document.getElementById('edit-precio').value);
    const cantidad = parseFloat(document.getElementById('edit-cantidad').value);
    const cantidadOriginal = parseFloat(document.getElementById('edit-cantidad-original').value);

    if (!nombre || !tipoUnidad || !precio || !cantidad || !cantidadOriginal) {
        mostrarAlerta('Complete todos los campos', 'error');
        return;
    }

    const productoIndex = productos.findIndex(p => p.id === id);
    if (productoIndex !== -1) {
        productos[productoIndex] = new Producto(
            id,
            nombre,
            tipoUnidad,
            precio,
            cantidad,
            cantidadOriginal
        );

        Storage.setProductos(productos);
        mostrarAlerta('Producto actualizado');
        cargarProductos();
        cargarSelectProductos();
        actualizarEstadisticas();
        cerrarModal('modal-editar-producto');
    }
}

// Funciones de exportación/importación
function exportarDatos() {
    const datos = {
        productos: productos,
        pedidos: pedidos,
        estadisticas: estadisticas,
        fechaExportacion: new Date().toISOString()
    };

    const datosJSON = JSON.stringify(datos, null, 2);
    const blob = new Blob([datosJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const fecha = new Date();
    const nombreArchivo = `datos_${fecha.getFullYear()}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}_${fecha.getHours().toString().padStart(2, '0')}${fecha.getMinutes().toString().padStart(2, '0')}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    mostrarAlerta('Datos exportados correctamente');
}

function importarDatos(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const datos = JSON.parse(e.target.result);

            if (confirm('¿Está seguro de que desea importar estos datos? Se sobrescribirán los datos actuales.')) {
                if (datos.productos) productos = datos.productos;
                if (datos.pedidos) pedidos = datos.pedidos;
                if (datos.estadisticas) estadisticas = datos.estadisticas;

                Storage.setProductos(productos);
                Storage.setPedidos(pedidos);
                Storage.setEstadisticas(estadisticas);

                cargarProductos();
                cargarSelectProductos();
                cargarHistorialPedidos();
                actualizarEstadisticas();

                mostrarAlerta('Datos importados correctamente');
            }
        } catch (error) {
            mostrarAlerta('Error al importar datos: archivo inválido', 'error');
            console.error(error);
        }
    };
    reader.readAsText(file);

    // Limpiar el input para permitir importar el mismo archivo otra vez
    event.target.value = '';
}

function reiniciarDatos() {
    if (confirm('¿Está seguro de que desea reiniciar todos los datos? Esta acción no se puede deshacer.')) {
        productos = [];
        pedidos = [];
        estadisticas = {
            productosVendidos: {},
            ingresosTotales: 0,
            totalPedidos: 0
        };
        pedidoActual = new Pedido(generarId());

        Storage.setProductos(productos);
        Storage.setPedidos(pedidos);
        Storage.setEstadisticas(estadisticas);

        cargarProductos();
        cargarSelectProductos();
        cargarHistorialPedidos();
        actualizarEstadisticas();

        mostrarAlerta('Datos reiniciados correctamente');
    }
}

// Gestión de pedidos
function agregarItemPedido() {
    const productoId = document.getElementById('producto-pedido').value;
    const cantidad = parseFloat(document.getElementById('cantidad-pedido').value);

    if (!productoId || !cantidad || cantidad <= 0) {
        mostrarAlerta('Seleccione producto y cantidad', 'error');
        return;
    }

    const producto = productos.find(p => p.id === productoId);
    if (!producto) {
        mostrarAlerta('Producto no encontrado', 'error');
        return;
    }

    if (cantidad > producto.cantidad) {
        mostrarAlerta(`Stock insuficiente: ${producto.cantidad}`, 'error');
        return;
    }

    pedidoActual.agregarItem(producto, cantidad);
    actualizarResumenPedido();
    document.getElementById('cantidad-pedido').value = '';
}

function actualizarResumenPedido() {
    const container = document.getElementById('items-pedido');
    const totalElement = document.getElementById('total-pedido');

    if (pedidoActual.items.length === 0) {
        container.innerHTML = '<p class="text-sm">No hay productos</p>';
        totalElement.textContent = 'Total: 0.00 CUP';
        return;
    }

    container.innerHTML = pedidoActual.items.map(item => `
        <div class="order-item">
            <span class="text-sm">${acortarTexto(item.producto.nombre, 20)} (${item.cantidad} ${item.producto.tipoUnidad === 'unidades' ? 'U' : 'Lb'})</span>
            <span class="text-sm">${formatearMoneda(item.subtotal)}</span>
        </div>
    `).join('');

    totalElement.textContent = `Total: ${formatearMoneda(pedidoActual.total)}`;
}

function finalizarPedido() {
    if (pedidoActual.items.length === 0) {
        mostrarAlerta('Pedido vacío', 'error');
        return;
    }

    // Actualizar inventario y estadísticas
    pedidoActual.items.forEach(item => {
        const producto = productos.find(p => p.id === item.producto.id);
        if (producto) {
            producto.cantidad -= item.cantidad;

            if (!estadisticas.productosVendidos[producto.id]) {
                estadisticas.productosVendidos[producto.id] = {
                    nombre: producto.nombre,
                    cantidad: 0,
                    ingresos: 0
                };
            }
            estadisticas.productosVendidos[producto.id].cantidad += item.cantidad;
            estadisticas.productosVendidos[producto.id].ingresos += item.subtotal;
        }
    });

    estadisticas.ingresosTotales += pedidoActual.total;
    estadisticas.totalPedidos += 1;

    // Guardar pedido
    pedidos.push({
        id: pedidoActual.id,
        fecha: pedidoActual.fecha,
        items: pedidoActual.items.map(item => ({
            productoId: item.producto.id,
            productoNombre: item.producto.nombre,
            cantidad: item.cantidad,
            subtotal: item.subtotal,
            tipoUnidad: item.producto.tipoUnidad
        })),
        total: pedidoActual.total
    });

    // Guardar cambios
    Storage.setProductos(productos);
    Storage.setPedidos(pedidos);
    Storage.setEstadisticas(estadisticas);

    // Reiniciar pedido actual
    pedidoActual = new Pedido(generarId());

    mostrarAlerta('Pedido finalizado');
    actualizarResumenPedido();
    cargarProductos();
    cargarHistorialPedidos();
    actualizarEstadisticas();
    cerrarModal('modal-pedido');
}

function cargarHistorialPedidos() {
    const tbody = document.getElementById('lista-pedidos');
    const emptyState = document.getElementById('empty-orders');

    if (pedidos.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    tbody.innerHTML = pedidos.map(pedido => `
        <tr>
            <td class="text-sm">${pedido.id.substr(-4)}</td>
            <td class="hide-on-mobile text-sm">${pedido.fecha.split(' ')[0]}</td>
            <td class="text-sm">${pedido.items.length} prod.</td>
            <td class="text-sm">${parseFloat(pedido.total).toFixed(0)}</td>
            <td class="actions">
                <button class="btn btn-icon" onclick="verDetallePedido('${pedido.id}')" title="Ver">
                    <svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                </button>
            </td>
        </tr>
    `).join('');
}

function verDetallePedido(id) {
    const pedido = pedidos.find(p => p.id === id);
    if (!pedido) return;

    const contenido = document.getElementById('detalle-pedido-contenido');
    contenido.innerHTML = `
        <p class="text-sm"><strong>ID:</strong> ${pedido.id}</p>
        <p class="text-sm"><strong>Fecha:</strong> ${pedido.fecha}</p>
        <h4 class="text-sm">Productos:</h4>
        <div class="order-details">
            ${pedido.items.map(item => `
                <div class="order-details-item">
                    <span class="text-sm">${acortarTexto(item.productoNombre, 25)} (${item.cantidad} ${item.tipoUnidad === 'unidades' ? 'U' : 'Lb'})</span>
                    <span class="text-sm">${formatearMoneda(item.subtotal)}</span>
                </div>
            `).join('')}
        </div>
        <div class="order-total text-sm">Total: ${formatearMoneda(pedido.total)}</div>
    `;

    abrirModal('modal-detalle-pedido');
}

// Gestión de estadísticas
function actualizarEstadisticas() {
    document.getElementById('total-productos').textContent = productos.length;
    document.getElementById('total-pedidos').textContent = estadisticas.totalPedidos;
    document.getElementById('ingresos-totales').textContent = formatearMoneda(estadisticas.ingresosTotales);

    const valorInventario = productos.reduce((total, producto) =>
        total + (producto.precio * producto.cantidad), 0
    );
    document.getElementById('valor-inventario').textContent = formatearMoneda(valorInventario);

    const tbodyPopulares = document.getElementById('lista-populares');
    const emptyStats = document.getElementById('empty-stats');

    const productosPopulares = Object.values(estadisticas.productosVendidos)
        .sort((a, b) => b.ingresos - a.ingresos);

    if (productosPopulares.length === 0) {
        tbodyPopulares.innerHTML = '';
        emptyStats.style.display = 'block';
    } else {
        emptyStats.style.display = 'none';
        tbodyPopulares.innerHTML = productosPopulares.map(producto => `
            <tr>
                <td class="product-name text-truncate" title="${producto.nombre}">${acortarTexto(producto.nombre, 15)}</td>
                <td class="text-sm">${producto.cantidad}</td>
                <td class="text-sm">${parseFloat(producto.ingresos).toFixed(0)}</td>
            </tr>
        `).join('');
    }

    const tbodyInventario = document.getElementById('lista-inventario');
    tbodyInventario.innerHTML = productos.map(producto => {
        const porcentaje = calcularPorcentajeStock(producto.cantidad, producto.cantidadOriginal);
        const claseStock = obtenerClaseStock(porcentaje);

        return `
            <tr>
                <td class="product-name text-truncate" title="${producto.nombre}">${acortarTexto(producto.nombre, 12)}</td>
                <td class="hide-on-mobile text-sm">${producto.tipoUnidad === 'unidades' ? 'U' : 'Lb'}</td>
                <td>
                    <div class="text-xs">${producto.cantidad}/${producto.cantidadOriginal}</div>
                    <div class="stock-bar">
                        <div class="stock-fill ${claseStock}" style="width: ${porcentaje}%"></div>
                    </div>
                    <div class="stock-info">
                        <span>${porcentaje.toFixed(0)}%</span>
                    </div>
                </td>
                <td class="hide-on-mobile text-sm">${porcentaje.toFixed(0)}%</td>
                <td class="text-sm">${parseFloat(producto.precio * producto.cantidad).toFixed(0)}</td>
            </tr>
        `;
    }).join('');
}

// Gestión de modales
function abrirModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function cerrarModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    if (modalId === 'modal-producto') {
        document.getElementById('form-producto').reset();
    } else if (modalId === 'modal-pedido') {
        document.getElementById('form-pedido').reset();
        pedidoActual = new Pedido(generarId());
        actualizarResumenPedido();
    }
}

// Navegación por pestañas
function inicializarTabs() {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab');

            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(target).classList.add('active');

            if (target === 'estadisticas') {
                actualizarEstadisticas();
            }
        });
    });
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    cargarSelectProductos();
    cargarHistorialPedidos();
    actualizarEstadisticas();
    inicializarTabs();

    document.getElementById('btn-add-product').addEventListener('click', () => abrirModal('modal-producto'));
    document.getElementById('btn-add-order').addEventListener('click', () => abrirModal('modal-pedido'));
    document.getElementById('btn-add-first-product').addEventListener('click', () => abrirModal('modal-producto'));
    document.getElementById('btn-add-first-order').addEventListener('click', () => abrirModal('modal-pedido'));
    document.getElementById('btn-float-add').addEventListener('click', () => {
        const activeTab = document.querySelector('.tab.active').getAttribute('data-tab');
        if (activeTab === 'productos') {
            abrirModal('modal-producto');
        } else if (activeTab === 'pedidos') {
            abrirModal('modal-pedido');
        }
    });

    document.getElementById('save-producto').addEventListener('click', () => {
        const nombre = document.getElementById('nombre').value;
        const tipoUnidad = document.getElementById('tipo-unidad').value;
        const precio = document.getElementById('precio').value;
        const cantidad = document.getElementById('cantidad').value;

        if (!nombre || !tipoUnidad || !precio || !cantidad) {
            mostrarAlerta('Complete todos los campos', 'error');
            return;
        }

        agregarProducto(nombre, tipoUnidad, precio, cantidad);
    });

    document.getElementById('form-pedido').addEventListener('submit', (e) => {
        e.preventDefault();
        agregarItemPedido();
    });

    document.getElementById('finalizar-pedido').addEventListener('click', finalizarPedido);

    document.getElementById('close-modal-producto').addEventListener('click', () => cerrarModal('modal-producto'));
    document.getElementById('cancel-modal-producto').addEventListener('click', () => cerrarModal('modal-producto'));
    document.getElementById('close-modal-pedido').addEventListener('click', () => cerrarModal('modal-pedido'));
    document.getElementById('cancel-modal-pedido').addEventListener('click', () => cerrarModal('modal-pedido'));
    document.getElementById('close-modal-detalle').addEventListener('click', () => cerrarModal('modal-detalle-pedido'));
    document.getElementById('close-detalle').addEventListener('click', () => cerrarModal('modal-detalle-pedido'));

    // Eventos para las nuevas funcionalidades
    document.getElementById('btn-reset').addEventListener('click', reiniciarDatos);
    document.getElementById('btn-export').addEventListener('click', exportarDatos);
    document.getElementById('btn-import').addEventListener('click', () => {
        document.getElementById('file-import').click();
    });

    // Input oculto para importar archivos
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    fileInput.id = 'file-import';
    fileInput.addEventListener('change', importarDatos);
    document.body.appendChild(fileInput);

    // Eventos para el modal de edición
    document.getElementById('save-editar-producto').addEventListener('click', guardarEdicionProducto);
    document.getElementById('close-modal-editar').addEventListener('click', () => cerrarModal('modal-editar-producto'));
    document.getElementById('cancel-modal-editar').addEventListener('click', () => cerrarModal('modal-editar-producto'));

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                cerrarModal(modal.id);
            }
        });
    });
});