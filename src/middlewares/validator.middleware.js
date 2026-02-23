const validarEsquema = (schema) => (req, res, next) => {
    const validacion = schema.safeParse(req.body);

    // Si los datos NO cumplen las reglas
    if (!validacion.success) {
        return res.status(400).json({
            status: 'error',
            message: 'Datos incorrectos en el formulario',
            // Usamos .issues en lugar de .errors (es el estándar de Zod)
            errores: validacion.error.issues.map(issue => issue.message)
        });
    }

    // Si los datos son perfectos, los pasamos limpios a tu controlador
    req.body = validacion.data;
    next();
};

module.exports = {
    validarEsquema
};