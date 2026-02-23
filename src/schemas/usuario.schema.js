const { z } = require('zod');

// Reglas para registrar a un nuevo empleado/admin
const registrarUsuarioSchema = z.object({
    nombre_completo: z.string({ required_error: "El nombre es obligatorio" }).min(3, "Nombre muy corto"),
    email: z.string({ required_error: "El correo es obligatorio" }).email("Formato de correo inválido"),
    // Zod verificará que la contraseña tenga al menos 6 caracteres antes de encriptarla
    password: z.string({ required_error: "La contraseña es obligatoria" }).min(6, "Mínimo 6 caracteres"),
    telefono: z.string().optional()
});

// Reglas para iniciar sesión
const loginSchema = z.object({
    email: z.string().email("Formato de correo inválido"),
    password: z.string().min(1, "La contraseña es obligatoria")
});

module.exports = {
    registrarUsuarioSchema,
    loginSchema
};