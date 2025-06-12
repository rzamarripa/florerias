export interface UserProfile {
    nombre: string;
    nombreCompleto: string;
    path: string;
    estatus: boolean;
}

export interface Role {
    _id: string;
    name: string;
    description?: string;
}

export interface User {
    _id: string;
    username: string;
    department?: string;
    profile: UserProfile;
    role?: Role;
    createdAt: string;
    updatedAt: string;
}

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

export interface UserFilters {
    estatus: string;
    username: string;
    role: string;
    department: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    count?: number;
    pagination?: PaginationInfo;
}

export interface UserStats {
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
}
export interface UsersBaseStore {
    // Estado
    users: User[];
    currentUser: User | null;
    loading: boolean;
    error: string | null;
    pagination: PaginationInfo;
    filters: UserFilters;

    // Acciones básicas
    clearError: () => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string) => void;
    setUsers: (users: User[]) => void;
    setCurrentUser: (user: User | null) => void;
    setPagination: (pagination: PaginationInfo) => void;
    setFilters: (newFilters: Partial<UserFilters>) => void;
    clearFilters: () => void;

    updateUserInList: (userId: string, updatedUser: User) => void;
    addUserToList: (newUser: User) => void;
    removeUserFromList: (userId: string) => void;

    getUserByUsername: (username: string) => User | undefined;
    getActiveUsers: () => User[];
    getInactiveUsers: () => User[];
    getUsersByRole: (roleName: string) => User[];
    getUserStats: () => UserStats;
    canPerformAction: (action: string, userRole: string) => boolean;
    resetStore: () => void;
}

export interface SearchParams extends Partial<UserFilters> {
    page?: number;
    limit?: number;
}

export interface UsernameAvailability {
    available: boolean;
    message: string;
}


export interface UsersGetStore {
    // Operaciones de lectura
    getAllUsers: (page?: number, limit?: number) => Promise<ApiResponse<User[]>>;
    getUserById: (userId: string) => Promise<User>;
    searchUsers: (searchTerm: string) => Promise<void>;
    filterByStatus: (estatus: string) => Promise<void>;
    filterByRole: (role: string) => Promise<void>;
    filterByDepartment: (department: string) => Promise<void>;

    // Paginación
    goToPage: (page: number) => Promise<void>;
    changePageLimit: (limit: number) => Promise<void>;
    goToPreviousPage: () => Promise<void>;
    goToNextPage: () => Promise<void>;

    // Operaciones de refrescar
    refreshUsers: () => Promise<void>;
    refreshUser: (userId: string) => Promise<void>;

    // Búsqueda avanzada
    searchWithFilters: (searchParams: SearchParams) => Promise<void>;
    clearFiltersAndReload: () => Promise<void>;

    // Verificaciones
    checkUserExists: (username: string) => Promise<boolean>;
}


export interface CreateUserForm {
    username: string;
    password: string;
    confirmPassword: string;
    department: string;
    profile: {
        nombre: string;
        nombreCompleto: string;
        path: string;
        estatus: boolean;
    };
    role: string | null;
}

export interface CreateUserData {
    username: string;
    password: string;
    department?: string;
    profile?: Partial<UserProfile>;
    role?: string;
}

export interface FormErrors {
    [key: string]: string;
}

export interface UsernameAvailability {
    available: boolean;
    message: string;
}

export interface BulkCreateResult {
    successful: Array<{
        index: number;
        success: boolean;
        data: ApiResponse;
    }>;
    failed: Array<{
        index: number;
        success: boolean;
        error: string;
        userData: CreateUserData;
    }>;
    total: number;
    successCount: number;
    errorCount: number;
}

export interface EditUserForm {
    username: string;
    department: string;
    profile: {
        nombre: string;
        nombreCompleto: string;
        path: string;
        estatus: boolean;
    };
    role: string | null;
}

export interface UpdateUserData {
    username?: string;
    department?: string;
    profile?: Partial<UserProfile>;
    role?: string;
}

export interface PasswordForm {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

export interface UserUpdate {
    userId: string;
    data: UpdateUserData;
}

export interface BulkUpdateResult {
    successful: Array<{
        userId: string;
        success: boolean;
        data: ApiResponse;
    }>;
    failed: Array<{
        userId: string;
        success: boolean;
        error: string;
    }>;
    total: number;
    successCount: number;
    errorCount: number;
}

export interface UsersUpdateStore {
    // Estado
    editingUser: User | null;
    editForm: EditUserForm;
    isUpdating: boolean;
    updateError: string | null;
    updateSuccess: boolean;
    passwordForm: PasswordForm;
    isChangingPassword: boolean;
    passwordError: string | null;
    passwordSuccess: boolean;
    isAssigningRole: boolean;
    roleError: string | null;
    roleSuccess: boolean;
    isTogglingStatus: boolean;
    statusError: string | null;
    statusSuccess: boolean;

    // Acciones de formulario
    startEditingUser: (user: User) => void;
    updateEditFormField: (field: string, value: any) => void;
    cancelEditing: () => void;
    updatePasswordFormField: (field: keyof PasswordForm, value: string) => void;

    // Operaciones de actualización
    updateUser: (userId: string, updateData?: UpdateUserData) => Promise<ApiResponse>;
    updateUserProfile: (userId: string, profileData: Partial<UserProfile>) => Promise<ApiResponse>;
    updateUserDepartment: (userId: string, department: string) => Promise<ApiResponse>;
    updateMultipleUsers: (userUpdates: UserUpdate[]) => Promise<BulkUpdateResult>;

    // Operaciones de contraseña
    changePassword: (userId: string, passwordData?: ChangePasswordData) => Promise<ApiResponse>;
    clearPasswordForm: () => void;

    // Operaciones de roles
    assignRole: (userId: string, roleId: string) => Promise<ApiResponse>;
    assignRoleToMultipleUsers: (userIds: string[], roleId: string) => Promise<BulkUpdateResult>;

    // Operaciones de activación
    activateUser: (userId: string) => Promise<ApiResponse>;
    activateMultipleUsers: (userIds: string[]) => Promise<BulkUpdateResult>;

    // Validaciones
    validateEditForm: () => ValidationResult;
    validatePasswordForm: () => ValidationResult;

    // Cleanup
    clearUpdateState: () => void;
    resetUpdateStore: () => void;
}