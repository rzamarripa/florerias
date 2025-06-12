import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided, authorization denied",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).populate({
      path: "role",
      populate: {
        path: "modules",
        populate: {
          path: "page",
          select: "name path",
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is not valid",
      });
    }

    if (!user.profile.estatus) {
      return res.status(401).json({
        success: false,
        message: "User account is deactivated",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Token is not valid",
    });
  }
};

const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user.role) {
      return res.status(403).json({
        success: false,
        message: "User has no role assigned",
      });
    }

    const userRoleName = req.user.role.name;
    const hasPermission = roles.some(
      (roleName) =>
        roleName.replace(/\s+/g, "").toLowerCase() ===
        userRoleName.replace(/\s+/g, "").toLowerCase()
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(", ")}`,
      });
    }

    next();
  };
};

const authorizeModule = (moduleName) => {
  return (req, res, next) => {
    if (!req.user.role || !req.user.role.modules) {
      return res.status(403).json({
        success: false,
        message: "User has no role or modules assigned",
      });
    }

    const hasModuleAccess = req.user.role.modules.some(
      (module) => module.name === moduleName
    );

    if (!hasModuleAccess) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required module: ${moduleName}`,
      });
    }

    next();
  };
};

export { authorize, authorizeModule, protect };
