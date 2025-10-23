# Seed Data for FloriSoft Backend

This seed file creates initial data for the FloriSoft application including users, roles, and permissions.

## What it creates

### 1. Department

- **Administración** - Main department for all users

### 2. Page

- **Gestión de Usuarios** - Page for user management at `/admin/users`

### 3. Modules (Permissions)

- **Crear Usuario** - Permission to create new users
- **Editar Usuario** - Permission to edit existing users
- **Eliminar Usuario** - Permission to delete users
- **Ver Usuarios** - Permission to view user list

### 4. Roles

- **Administrador** - Full permissions for user management
- **Usuario** - Basic role with only view permissions

### 5. Users

- **admin** - Administrator with full permissions
- **juan.perez** - Regular user
- **maria.garcia** - Regular user
- **carlos.lopez** - Regular user
- **ana.martinez** - Regular user

### 6. Expense Concept Categories

- **Servicios Públicos** - Utilities and public services
- **Mantenimiento** - Maintenance services
- **Equipamiento** - Equipment and technology
- **Materiales de Oficina** - Office supplies
- **Servicios Profesionales** - Professional services

### 7. Expense Concepts

- **Electricidad** - Monthly electricity consumption
- **Agua** - Monthly water consumption
- **Limpieza** - Cleaning and maintenance services
- **Computadoras** - Computer and technology equipment
- **Papelería** - Writing materials and office supplies

## How to run

### Prerequisites

1. Make sure MongoDB is running
2. Set up your `.env` file with `MONGODB_URI`
3. Install dependencies: `npm install`

### Execute seed

```bash
npm run seed
```

## Admin User Credentials

After running the seed, you can login with:

- **Username**: `admin`
- **Password**: `Admin123!`
- **Email**: `admin@floriSoft.com`

This user has full permissions to create, edit, delete, and view users.

## Regular User Credentials

All other users have the password: `User123!`

## Database Collections Created

The seed will create documents in these collections:

- `cc_department` - Department information
- `ac_page` - Page definitions
- `ac_module` - Permission modules
- `ac_role` - User roles
- `cs_user` - User accounts
- `cc_expense_concept_category` - Expense concept categories
- `cc_expense_concept` - Expense concepts

## Notes

- All users are created in the "Administración" department
- The admin user has all user management permissions
- Regular users can only view the user list
- All users are created with `estatus: true` (active)
- Passwords are automatically hashed using bcrypt
- Expense concepts are linked to categories and the "Administración" department
- All expense categories and concepts are created with `isActive: true`
