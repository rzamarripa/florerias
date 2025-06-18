import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { BsPencil } from "react-icons/bs";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { stateSchema, StateFormData, AVAILABLE_COUNTRIES } from "../schemas/stateSchema";
import { State } from "../types";



interface StateModalProps {
    mode: "create" | "edit";
    onStateSaved?: () => void;
    editingState?: State | null;
    buttonProps?: {
        variant?: string;
        size?: "sm" | "lg";
        className?: string;
        title?: string;
    };
}


const StateModal: React.FC<StateModalProps> = ({
    mode,
    onStateSaved,
    editingState = null,
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
    } = useForm<StateFormData>({
        resolver: zodResolver(stateSchema),
        defaultValues: {
            name: "",
            country: "",
        },
        mode: "onChange",
    });

    useEffect(() => {
        if (showModal) {
            if (isEditing && editingState) {
                setValue("name", editingState.name);
                setValue("country", editingState.country);
            } else {
                reset({
                    name: "",
                    country: "",
                });
            }
        }
    }, [showModal, isEditing, editingState, setValue, reset]);

    const handleOpenModal = () => {
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        reset();
    };

    const onSubmit = async (data: StateFormData) => {
        try {
            console.log(data);
        } catch (error: any) {
            console.error("Error in state operation:", error);

            let errorMessage = `Error al ${isEditing ? 'actualizar' : 'crear'} el estado`;

            if (error.response?.status === 400) {
                errorMessage = error.response.data?.message || "Ya existe este estado en el sistema";
            } else if (error.response?.status === 404) {
                errorMessage = "Estado no encontrado";
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
            title: "Nuevo Estado",
            children: (
                <>
                    <Plus size={18} />
                    Nuevo Estado
                </>
            )
        },
        edit: {
            variant: "light",
            size: "sm" as const,
            className: "btn-icon rounded-circle",
            title: "Editar estado",
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
                disabled={isEditing && !editingState}
            >
                {finalButtonProps.children}
            </Button>

            <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {isEditing ? "Editar Estado" : "Nuevo Estado"}
                    </Modal.Title>
                </Modal.Header>

                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>
                                Estado <span className="text-danger">*</span>
                            </Form.Label>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <Form.Control
                                        type="text"
                                        placeholder="Nombre del estado"
                                        isInvalid={!!errors.name}
                                        {...field}
                                    />
                                )}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.name?.message}
                            </Form.Control.Feedback>
                            <Form.Text className="text-muted">
                                Ejemplo: Sinaloa, California, Ontario, etc.
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
                                Selecciona el país al que pertenece este estado
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

export default StateModal;