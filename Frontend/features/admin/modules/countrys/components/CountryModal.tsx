import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { BsPencil } from "react-icons/bs";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { countrySchema, CountryFormData, AVAILABLE_COUNTRIES } from "../schemas/countrySchemas";

interface Country {
    _id: string;
    name: string;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
}

interface CountryModalProps {
    mode: "create" | "edit";
    onCountrySaved?: () => void;
    editingCountry?: Country | null;
    buttonProps?: {
        variant?: string;
        size?: "sm" | "lg";
        className?: string;
        title?: string;
    };
}


interface Country {
    _id: string;
    name: string;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
}

interface CountryModalProps {
    mode: "create" | "edit";
    onCountrySaved?: () => void;
    editingCountry?: Country | null;
    buttonProps?: {
        variant?: string;
        size?: "sm" | "lg";
        className?: string;
        title?: string;
    };
}

// Mock service - replace with actual service
const countryService = {
    create: async (data: CountryFormData) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, message: "País creado exitosamente" };
    },

    update: async (id: string, data: CountryFormData) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, message: "País actualizado exitosamente" };
    }
};

const CountryModal: React.FC<CountryModalProps> = ({
    mode,
    onCountrySaved,
    editingCountry = null,
    buttonProps = {},
}) => {
    const [showModal, setShowModal] = useState<boolean>(false);
    const isEditing = mode === "edit";

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isSubmitting, isValid },
    } = useForm<CountryFormData>({
        resolver: zodResolver(countrySchema),
        defaultValues: {
            name: "",
        },
        mode: "onChange",
    });

    useEffect(() => {
        if (showModal) {
            if (isEditing && editingCountry) {
                setValue("name", editingCountry.name);
            } else {
                reset({
                    name: "",
                });
            }
        }
    }, [showModal, isEditing, editingCountry, setValue, reset]);

    const handleOpenModal = () => {
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        reset();
    };

    const onSubmit = async (data: CountryFormData) => {
        try {
            const countryData: CountryFormData = {
                name: data.name.trim(),
            };

            let response;
            if (isEditing && editingCountry) {
                response = await countryService.update(editingCountry._id, countryData);
            } else {
                response = await countryService.create(countryData);
            }

            if (response.success) {
                const action = isEditing ? "actualizado" : "creado";
                toast.success(`País "${countryData.name}" ${action} exitosamente`);
                onCountrySaved?.();
                handleCloseModal();
            } else {
                const errorMessage = response.message || `Error al ${isEditing ? 'actualizar' : 'crear'} el país`;
                toast.error(errorMessage);
            }
        } catch (error: any) {
            console.error("Error in country operation:", error);

            let errorMessage = `Error al ${isEditing ? 'actualizar' : 'crear'} el país`;

            if (error.response?.status === 400) {
                errorMessage = error.response.data?.message || "Ya existe este país en el sistema";
            } else if (error.response?.status === 404) {
                errorMessage = "País no encontrado";
            } else if (error.response?.status >= 500) {
                errorMessage = "Error interno del servidor. Intenta nuevamente.";
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
        }
    };

    const defaultButtonProps = {
        create: {
            variant: "primary",
            className: "d-flex align-items-center gap-2 text-nowrap px-3",
            title: "Nuevo País",
            children: (
                <>
                    <Plus size={18} />
                    Nuevo País
                </>
            )
        },
        edit: {
            variant: "light",
            size: "sm" as const,
            className: "btn-icon rounded-circle",
            title: "Editar país",
            children: <BsPencil size={16} />
        }
    };

    const currentButtonConfig = defaultButtonProps[mode];
    const finalButtonProps = { ...currentButtonConfig, ...buttonProps };

    return (
        <>
            <Button
                variant={finalButtonProps.variant}
                size={finalButtonProps.size}
                className={finalButtonProps.className}
                title={finalButtonProps.title}
                onClick={handleOpenModal}
                disabled={isEditing && !editingCountry}
            >
                {finalButtonProps.children}
            </Button>

            <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {isEditing ? "Editar País" : "Nuevo País"}
                    </Modal.Title>
                </Modal.Header>

                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>
                                País <span className="text-danger">*</span>
                            </Form.Label>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <Form.Select
                                        {...field}
                                        isInvalid={!!errors.name}
                                    >
                                        <option value="">Seleccionar país...</option>
                                        {AVAILABLE_COUNTRIES.map((country) => (
                                            <option key={country} value={country}>
                                                {country}
                                            </option>
                                        ))}
                                    </Form.Select>
                                )}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.name?.message}
                            </Form.Control.Feedback>
                            <Form.Text className="text-muted">
                                Selecciona el país que deseas agregar al sistema
                            </Form.Text>
                        </Form.Group>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            onClick={handleCloseModal}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isSubmitting || !isValid}
                        >
                            {isSubmitting ? (
                                <>
                                    <span
                                        className="spinner-border spinner-border-sm me-2"
                                        role="status"
                                        aria-hidden="true"
                                    ></span>
                                    {isEditing ? "Actualizando..." : "Guardando..."}
                                </>
                            ) : (
                                isEditing ? "Actualizar" : "Guardar"
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
};

export default CountryModal;