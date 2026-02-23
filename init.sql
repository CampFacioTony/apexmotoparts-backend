-- 0. HABILITAR EXTENSIÓN PARA UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ROLES
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. EMPRESAS (Mercado B2B y Flotillas)
CREATE TABLE empresas_flotillas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    razon_social VARCHAR(150) NOT NULL,
    rfc VARCHAR(20) UNIQUE,
    nivel_descuento_global DECIMAL(5,2) DEFAULT 0.00,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. USUARIOS (Clientes B2C y B2B)
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rol_id UUID REFERENCES roles(id),
    empresa_id UUID REFERENCES empresas_flotillas(id),
    nombre_completo VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefono VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nivel_lealtad VARCHAR(20) DEFAULT 'BRONCE' CHECK (nivel_lealtad IN ('BRONCE', 'PLATA', 'ORO', 'MAYORISTA', 'CORPORATIVO')),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. VINCULAR GERENTE A EMPRESA
ALTER TABLE empresas_flotillas ADD COLUMN contacto_principal_id UUID REFERENCES usuarios(id);

-- 5. CATÁLOGO GLOBAL DE VEHÍCULOS
CREATE TABLE vehiculos_catalogo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('MOTO', 'ATV', 'UTV')),
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    cilindrada INT,
    anio_inicio INT NOT NULL,
    anio_fin INT,
    verificado BOOLEAN DEFAULT TRUE,
    creado_por_usuario_id UUID REFERENCES usuarios(id),
    popularidad INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. GARAJE DE CLIENTES Y FLOTILLAS
CREATE TABLE garaje_clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id),
    empresa_id UUID REFERENCES empresas_flotillas(id),
    vehiculo_catalogo_id UUID REFERENCES vehiculos_catalogo(id),
    apodo VARCHAR(50),
    numero_economico VARCHAR(50),
    placas VARCHAR(20),
    numero_serie_vin VARCHAR(50) UNIQUE,
    kilometraje_actual INT DEFAULT 0 CHECK (kilometraje_actual >= 0),
    fecha_ultimo_servicio DATE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. PROVEEDORES
CREATE TABLE proveedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    pais_origen VARCHAR(50) DEFAULT 'México',
    tiempo_entrega_estimado_dias INT DEFAULT 1,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. PRODUCTOS
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proveedor_id UUID REFERENCES proveedores(id),
    sku VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    gama VARCHAR(20) DEFAULT 'MEDIA' CHECK (gama IN ('BAJA', 'MEDIA', 'ALTA', 'OEM')),
    precio_venta DECIMAL(10,2) NOT NULL CHECK (precio_venta >= 0),
    stock_actual INT DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo_alerta INT DEFAULT 2,
    ubicacion_pasillo VARCHAR(10),
    ubicacion_anaquel VARCHAR(10),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. COMPATIBILIDAD (Filtro)
CREATE TABLE producto_compatibilidad (
    producto_id UUID REFERENCES productos(id),
    vehiculo_catalogo_id UUID REFERENCES vehiculos_catalogo(id),
    notas_instalacion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (producto_id, vehiculo_catalogo_id)
);

-- 10. PLANES DE MANTENIMIENTO PREDICTIVO
CREATE TABLE planes_mantenimiento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehiculo_catalogo_id UUID REFERENCES vehiculos_catalogo(id),
    producto_sugerido_id UUID REFERENCES productos(id),
    kilometraje_objetivo INT NOT NULL,
    titulo_alerta VARCHAR(100) NOT NULL,
    mensaje_push TEXT NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

-- 11. BÚSQUEDAS FALLIDAS
CREATE TABLE busquedas_fallidas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id),
    termino_buscado VARCHAR(255) NOT NULL,
    filtro_marca VARCHAR(50),
    filtro_modelo VARCHAR(100),
    fecha_busqueda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estatus_revision BOOLEAN DEFAULT FALSE
);

-- 12. VISTA DE IMPORTACIÓN INTELIGENTE
CREATE OR REPLACE VIEW vista_importacion_inteligente AS
SELECT 
    vc.marca,
    vc.modelo,
    vc.cilindrada,
    vc.anio_inicio,
    COUNT(gc.id) AS total_unidades_registradas,
    SUM(CASE WHEN u.nivel_lealtad IN ('ORO', 'MAYORISTA', 'CORPORATIVO') THEN 1 ELSE 0 END) AS dueños_premium,
    (COUNT(gc.id) * 1) + (SUM(CASE WHEN u.nivel_lealtad IN ('ORO', 'MAYORISTA', 'CORPORATIVO') THEN 1 ELSE 0 END) * 3) AS score_prioridad_importacion
FROM 
    garaje_clientes gc
JOIN 
    vehiculos_catalogo vc ON gc.vehiculo_catalogo_id = vc.id
JOIN 
    usuarios u ON gc.usuario_id = u.id
WHERE 
    gc.activo = TRUE 
    AND u.activo = TRUE
GROUP BY 
    vc.marca, vc.modelo, vc.cilindrada, vc.anio_inicio
ORDER BY 
    score_prioridad_importacion DESC;