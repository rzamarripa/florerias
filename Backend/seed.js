import mongoose from "mongoose";
import { Department } from "./src/models/Department.js";
import { Role } from "./src/models/Roles.js";
import { User } from "./src/models/User.js";
import { Module } from "./src/models/Module.js";
import { Page } from "./src/models/Page.js";
import { Client } from "./src/models/Client.js";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

const createSeedData = async () => {
  try {
    console.log("Starting seed data creation...");

    // Create a department
    const department = await Department.create({
      name: "Administración",
      isActive: true
    });
    console.log("Department created:", department.name);

    // Create a page for user management
    const userManagementPage = await Page.create({
      name: "Gestión de Usuarios",
      path: "/admin/users",
      description: "Página para administrar usuarios del sistema",
      status: true
    });
    console.log("Page created:", userManagementPage.name);

    // Create modules for user management
    const createUserModule = await Module.create({
      name: "Crear Usuario",
      description: "Permite crear nuevos usuarios en el sistema",
      page: userManagementPage._id,
      status: true
    });

    const editUserModule = await Module.create({
      name: "Editar Usuario",
      description: "Permite editar usuarios existentes",
      page: userManagementPage._id,
      status: true
    });

    const deleteUserModule = await Module.create({
      name: "Eliminar Usuario",
      description: "Permite eliminar usuarios del sistema",
      page: userManagementPage._id,
      status: true
    });

    const viewUsersModule = await Module.create({
      name: "Ver Usuarios",
      description: "Permite ver la lista de usuarios",
      page: userManagementPage._id,
      status: true
    });

    console.log("Modules created for user management");

    // Create admin role with user management permissions
    const adminRole = await Role.create({
      name: "Administrador",
      description: "Rol con permisos completos para gestionar usuarios",
      modules: [createUserModule._id, editUserModule._id, deleteUserModule._id, viewUsersModule._id],
      estatus: true
    });
    console.log("Admin role created:", adminRole.name);

    // Create regular user role
    const userRole = await Role.create({
      name: "Usuario",
      description: "Rol básico para usuarios regulares",
      modules: [viewUsersModule._id],
      estatus: true
    });
    console.log("User role created:", userRole.name);

    // Create 5 users
    const users = [
      {
        username: "admin",
        email: "admin@caprepa.com",
        phone: "555-0001",
        password: "Admin123!",
        profile: {
          name: "Administrador",
          lastName: "Sistema",
          fullName: "Administrador del Sistema",
          path: "/admin/profile",
          estatus: true
        },
        role: adminRole._id
      },
      {
        username: "juan.perez",
        email: "juan.perez@caprepa.com",
        phone: "555-0002",
        password: "User123!",
        profile: {
          name: "Juan",
          lastName: "Pérez",
          fullName: "Juan Pérez",
          path: "/users/juan/profile",
          estatus: true
        },
        role: userRole._id
      },
      {
        username: "maria.garcia",
        email: "maria.garcia@caprepa.com",
        phone: "555-0003",
        password: "User123!",
        profile: {
          name: "María",
          lastName: "García",
          fullName: "María García",
          path: "/users/maria/profile",
          estatus: true
        },
        role: userRole._id
      },
      {
        username: "carlos.lopez",
        email: "carlos.lopez@caprepa.com",
        phone: "555-0004",
        password: "User123!",
        profile: {
          name: "Carlos",
          lastName: "López",
          fullName: "Carlos López",
          path: "/users/carlos/profile",
          estatus: true
        },
        role: userRole._id
      },
      {
        username: "ana.martinez",
        email: "ana.martinez@caprepa.com",
        phone: "555-0005",
        password: "User123!",
        profile: {
          name: "Ana",
          lastName: "Martínez",
          fullName: "Ana Martínez",
          path: "/users/ana/profile",
          estatus: true
        },
        role: userRole._id
      }
    ];

    for (const userData of users) {
      const user = await User.create(userData);
      console.log(`User created: ${user.username} (${user.profile.fullName})`);
    }


    // Create clients
    console.log("\nCreating clients...");
    const clientsData = [
      {
        name: "Roberto",
        lastName: "Fernández García",
        phoneNumber: "555-1001",
        points: 150,
        status: true
      },
      {
        name: "Isabella",
        lastName: "Morales Ruiz",
        phoneNumber: "555-1002", 
        points: 320,
        status: true
      },
      {
        name: "Diego",
        lastName: "Vargas Mendoza",
        phoneNumber: "555-1003",
        points: 85,
        status: true
      },
      {
        name: "Valentina",
        lastName: "Restrepo Silva",
        phoneNumber: "555-1004",
        points: 500,
        status: false
      },
      {
        name: "Sebastián",
        lastName: "Herrera Castillo",
        phoneNumber: "555-1005",
        points: 275,
        status: true
      }
    ];

    for (const clientData of clientsData) {
      const client = await Client.create(clientData);
      console.log(`Client created: ${client.name} ${client.lastName} - ${client.clientNumber} (${client.points} points)`);
    }

    console.log("\n=== SEED COMPLETED SUCCESSFULLY ===");
    console.log("Created:");
    console.log(`- 1 Department: ${department.name}`);
    console.log(`- 1 Page: ${userManagementPage.name}`);
    console.log(`- 4 Modules for user management`);
    console.log(`- 2 Roles: ${adminRole.name}, ${userRole.name}`);
    console.log(`- 5 Users (1 admin, 4 regular users)`);
    console.log(`- 5 Clients with sample data`);
    console.log("\nAdmin user credentials:");
    console.log(`Username: admin`);
    console.log(`Password: Admin123!`);
    console.log(`Email: admin@caprepa.com`);

  } catch (error) {
    console.error("Error creating seed data:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
};

const runSeed = async () => {
  await connectDB();
  await createSeedData();
  process.exit(0);
};

runSeed(); 