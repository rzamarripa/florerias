import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { BsPencil } from "react-icons/bs";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { municipalitySchema, MunicipalityFormData, AVAILABLE_COUNTRIES, AVAILABLE_STATES } from "../schemas/municipalitySchema";

interface Municipality {
    _id: string;
    name: string;
    state: string;
    country: string;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
}

interface MunicipalityModalProps {
    mode: "create" | "edit";
    onMunicipalitySaved?: () => void;
    editingMunicipality?: Municipality | null;
    buttonProps?: {
        variant?: string;
        size?: "sm" | "lg";
        className?: string;
        title?: string;
    };
}

// Mock service - replace with actual service
const municipalityService = {
    create: async (data: MunicipalityFormData) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, message: "Municipio creado exitosamente" };
    },

    update: async (id: string, data: MunicipalityFormData) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, message: "Municipio actualizado exitosamente" };
    }
};

const MunicipalityModal: React.FC<MunicipalityModalProps> = ({
    mode,
    onMunicipalitySaved,
    editingMunicipality = null,
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
    } = useForm<MunicipalityFormData>({
        resolver: zodResolver(municipalitySchema),
        defaultValues: {
            name: "",
            state: "",
            country: "",
        },
        mode: "onChange",
    });

    useEffect(() => {
        if (showModal) {
            if (isEditing && editingMunicipality) {
                setValue("name", editingMunicipality.name);
                setValue("state", editingMunicipality.state);
                setValue("country", editingMunicipality.country);
            } else {
                reset({
                    name: "",
                    state: "",
                    country: "",
                });
            }
        }
    }, [showModal, isEditing, editingMunicipality, setValue, reset]);

    const handleOpenModal = () => {
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        reset();
    };

    const onSubmit = async (data: MunicipalityFormData) => {
        try {
            const municipalityData: MunicipalityFormData = {
                name: data.name.trim(),
                state: data.state.trim(),
                country: data.country.trim(),
            };

            let response;
            if (isEditing && editingMunicipality) {
                response = await municipalityService.update(editingMunicipality._id, municipalityData);
            } else {
                response = await municipalityService.create(municipalityData);
            }

            if (response.success) {
                const action = isEditing ? "actualizado" : "creado";
                toast.success(`Municipio "${municipalityData.name}" ${action} exitosamente`);
                onMunicipalitySaved?.();
                handleCloseModal();
            } else {
                const errorMessage = response.message || `Error al ${isEditing ? 'actualizar' : 'crear'} el municipio`;
                toast.error(errorMessage);
            }
        } catch (error: any) {
            console.error("Error in municipality operation:", error);

            let errorMessage = `Error al ${isEditing ? 'actualizar' : 'crear'} el municipio`;

            if (error.response?.status === 400) {
                errorMessage = error.response.data?.message || "Ya existe este municipio en el sistema";
            } else if (error.response?.status === 404) {
                errorMessage = "Municipio no encontrado";
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
            title: "Nuevo Municipio",
            children: (
                <>
                    <Plus size={18} />
                    Nuevo Municipio
                </>
            )
        },
        edit: {
            variant: "light",
            size: "sm" as const,
            className: "btn-icon rounded-circle",
            title: "Editar municipio",
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
                disabled={isEditing && !editingMunicipality}
            >
                {finalButtonProps.children}
            </Button>

            <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {isEditing ? "Editar Municipio" : "Nuevo Municipio"}
                    </Modal.Title>
                </Modal.Header>

                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>
                                Municipio <span className="text-danger">*</span>
                            </Form.Label>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <Form.Control
                                        type="text"
                                        placeholder="Nombre del municipio"
                                        isInvalid={!!errors.name}
                                        {...field}
                                    />
                                )}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.name?.message}
                            </Form.Control.Feedback>
                            <Form.Text className="text-muted">
                                Ejemplo: Culiacán, Los Angeles, Toronto, etc.
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>
                                Estado <span className="text-danger">*</span>
                            </Form.Label>
                            <Controller
                                name="state"
                                control={control}
                                render={({ field }) => (
                                    <Form.Select
                                        {...field}
                                        isInvalid={!!errors.state}
                                    >
                                        <option value="">Seleccionar estado...</option>
                                        {AVAILABLE_STATES.map((state) => (
                                            <option key={state} value={state}>
                                                {state}
                                            </option>
                                        ))}
                                    </Form.Select>
                                )}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.state?.message}
                            </Form.Control.Feedback>
                            <Form.Text className="text-muted">
                                Selecciona el estado al que pertenece este municipio
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>
                                País <span className="text-danger">*</span>
                            </Form.Label>
                            <Controller
                                name="country"
                                control={control}
                                render={({ field }) => (
                                    <Form.Select
                                        {...field}
                                        isInvalid={!!errors.country}
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
                                {errors.country?.message}
                            </Form.Control.Feedback>
                            <Form.Text className="text-muted">
                                Selecciona el país al que pertenece este municipio
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

export default MunicipalityModal;