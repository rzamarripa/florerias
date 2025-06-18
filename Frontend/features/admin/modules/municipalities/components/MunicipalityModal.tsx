import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { BsPencil } from "react-icons/bs";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { municipalitySchema, MunicipalityFormData } from "../schemas/municipalitySchema";
import { Municipality } from "../types";
import { createMunicipality, updateMunicipality } from "../services/municipalities";

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
            stateId: "",
            postalCodes: [],
        },
        mode: "onChange",
    });

    useEffect(() => {
        if (showModal) {
            if (isEditing && editingMunicipality) {
                setValue("name", editingMunicipality.name ?? "");
                setValue("stateId", editingMunicipality.stateId?._id ?? "");
                setValue("postalCodes", editingMunicipality.postalCodes ?? []);
            } else {
                reset({
                    name: "",
                    stateId: "",
                    postalCodes: [],
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
            let response;
            if (isEditing && editingMunicipality) {
                response = await updateMunicipality(editingMunicipality._id, data);
            } else {
                response = await createMunicipality(data);
            }
            if (response.success) {
                const action = isEditing ? "actualizado" : "creado";
                toast.success(`Municipio "${data.name}" ${action} exitosamente`);
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
                                name="stateId"
                                control={control}
                                render={({ field }) => (
                                    <Form.Select
                                        {...field}
                                        isInvalid={!!errors.stateId}
                                    >
                                        <option value="">Seleccionar estado...</option>
                                    </Form.Select>
                                )}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.stateId?.message}
                            </Form.Control.Feedback>
                            <Form.Text className="text-muted">
                                Selecciona el estado al que pertenece este municipio
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