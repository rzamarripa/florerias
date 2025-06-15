import Image from "next/image";
import React, { useState } from "react";
import { Badge, Modal } from "react-bootstrap";
import { BsEye } from "react-icons/bs";
import { type User } from "../services/users";

interface UserViewModalProps {
    user: User;
}

const UserViewModal: React.FC<UserViewModalProps> = ({ user }) => {
    const [show, setShow] = useState<boolean>(false);

    const handleShow = (): void => {
        setShow(true);
    };

    const handleClose = (): void => {
        setShow(false);
    };

    return (
        <>
            {/* Botón para abrir el modal */}
            <button
                className="btn btn-light btn-icon btn-sm rounded-circle"
                title="Ver usuario"
                onClick={(e) => {
                    e.preventDefault();
                    handleShow();
                }}
                tabIndex={0}
            >
                <BsEye size={16} />
            </button>

            {/* Modal */}
            <Modal
                show={show}
                onHide={handleClose}
                centered
                size="lg"
                style={{ maxHeight: "80vh" }}
            >
                <Modal.Header closeButton className="border-bottom-0 pb-1">
                    <Modal.Title className="text-dark fs-5 modal-title h4">
                        Información del Usuario
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body className="pt-1 pb-2" style={{ maxHeight: "60vh", }}>
                    <div className="text-center mb-3">
                        {/* Imagen de perfil */}
                        <div className="d-flex justify-content-center mb-2">
                            {user.profile.image ? (
                                <Image
                                    src={user.profile.image}
                                    alt={user.username}
                                    className="rounded-circle shadow-sm"
                                    width={70}
                                    height={70}
                                    style={{
                                        objectFit: "cover",
                                        border: "3px solid #e9ecef"
                                    }}
                                />
                            ) : (
                                <div
                                    className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                                    style={{
                                        width: "70px",
                                        height: "70px",
                                        fontSize: "1.8rem",
                                        fontWeight: "bold",
                                        border: "3px solid #e9ecef"
                                    }}
                                >
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Nombre de usuario principal */}
                        <h5 className="text-dark mb-1 fw-bold">{user.username}</h5>
                        <p className="text-muted mb-2 small">
                            {user.profile.nombreCompleto || user.profile.nombre || "Sin nombre completo"}
                        </p>

                        {/* Badge del rol */}
                        <Badge
                            bg="primary"
                            className="px-2 py-1 small mb-3"
                            style={{ borderRadius: "15px" }}
                        >
                            {user.role?.name || "Sin rol"}
                        </Badge>
                    </div>

                    {/* Información detallada */}
                    <div className="row g-2">
                        {/* Departamento y Estado en una fila */}
                        <div className="col-6">
                            <div className="card border-0 bg-light">
                                <div className="card-body py-2">
                                    <div className="d-flex align-items-center">
                                        <div className="me-2">
                                            <div
                                                className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                                                style={{ width: "30px", height: "30px" }}
                                            >
                                                <span style={{ fontSize: "0.8rem" }}>🏢</span>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1">
                                            <p className="text-muted mb-0" style={{ fontSize: "0.7rem", fontWeight: "500" }}>DEPARTAMENTO</p>
                                            <p className="text-dark mb-0 fw-medium" style={{ fontSize: "0.8rem" }}>
                                                {user.department || "No especificado"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-6">
                            <div className="card border-0 bg-light">
                                <div className="card-body py-2">
                                    <div className="d-flex align-items-center">
                                        <div className="me-2">
                                            <div
                                                className={`${user.profile.estatus
                                                    ? "bg-success"
                                                    : "bg-danger"} bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center`}
                                                style={{ width: "30px", height: "30px" }}
                                            >
                                                <span style={{ fontSize: "0.9rem" }}>
                                                    {user.profile.estatus ? "✓" : "✕"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1">
                                            <p className="text-muted mb-0" style={{ fontSize: "0.7rem", fontWeight: "500" }}>ESTATUS</p>
                                            <span
                                                className={`badge ${user.profile.estatus
                                                    ? "bg-success bg-opacity-10 text-success"
                                                    : "bg-danger bg-opacity-10 text-danger"
                                                    }`}
                                                style={{ fontSize: "0.7rem" }}
                                            >
                                                {user.profile.estatus ? "Activo" : "Inactivo"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fecha de creación */}
                        <div className="col-12">
                            <div className="card border-0 bg-light">
                                <div className="card-body py-2">
                                    <div className="d-flex align-items-center">
                                        <div className="me-2">
                                            <div
                                                className="bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                                                style={{ width: "30px", height: "30px" }}
                                            >
                                                <span style={{ fontSize: "0.8rem" }}>📅</span>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1">
                                            <p className="text-muted mb-0" style={{ fontSize: "0.7rem", fontWeight: "500" }}>FECHA DE CREACIÓN</p>
                                            <p className="text-dark mb-0 fw-medium" style={{ fontSize: "0.8rem" }}>
                                                {new Date(user.createdAt).toLocaleDateString("es-ES", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ID del usuario */}
                        <div className="col-12">
                            <div className="card border-0 bg-light">
                                <div className="card-body py-2">
                                    <div className="d-flex align-items-center">
                                        <div className="me-2">
                                            <div
                                                className="bg-secondary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                                                style={{ width: "30px", height: "30px" }}
                                            >
                                                <span style={{ fontSize: "0.8rem" }}>#</span>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1">
                                            <p className="text-muted mb-0" style={{ fontSize: "0.7rem", fontWeight: "500" }}>ID DE USUARIO</p>
                                            <code className="bg-white text-muted px-2 py-1 rounded border" style={{ fontSize: "0.7rem" }}>
                                                {user._id}
                                            </code>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal.Body>

                <Modal.Footer className="border-top-0 pt-1 pb-2">
                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm px-3"
                        onClick={handleClose}
                    >
                        Cerrar
                    </button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default UserViewModal;