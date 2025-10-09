import Image from "next/image";
import React, { useState } from "react";
import { Badge, Modal, Button } from "react-bootstrap";
import { BsEye } from "react-icons/bs";
import { User } from "../types";

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

        <Modal.Body className="pt-1 pb-2" style={{ maxHeight: "60vh" }}>
          <div className="text-center mb-3">
            <div className="d-flex justify-content-center mb-2">
              {typeof user?.profile?.image === "string" ? (
                <Image
                  src={user.profile.image}
                  alt={user.username}
                  className="rounded-circle shadow-sm"
                  width={70}
                  height={70}
                  style={{
                    objectFit: "cover",
                    border: "3px solid #e9ecef",
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
                    border: "3px solid #e9ecef",
                  }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <h5 className="text-dark mb-1 fw-bold">{user.username}</h5>
            <p className="text-muted mb-2 small">
              {user.profile.fullName ||
                user.profile.name ||
                "Sin nombre completo"}
            </p>

            <Badge
              bg="primary"
              className="px-2 py-1 small mb-3"
              style={{ borderRadius: "15px" }}
            >
              {typeof user.role === 'object' ? user.role.name : user.role || "Sin rol"}
            </Badge>
          </div>

          <div className="row g-2">
            <div className="col-12">
              <div className="card border-0 bg-light">
                <div className="card-body py-2">
                  <div className="d-flex align-items-center">
                    <div className="me-2">
                      <div
                        className={`${
                          user.profile.estatus ? "bg-success" : "bg-danger"
                        } bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center`}
                        style={{ width: "30px", height: "30px" }}
                      >
                        <span style={{ fontSize: "0.9rem" }}>
                          {user.profile.estatus ? "✓" : "✕"}
                        </span>
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <p
                        className="text-muted mb-0"
                        style={{ fontSize: "0.7rem", fontWeight: "500" }}
                      >
                        ESTATUS
                      </p>
                      <span
                        className={`badge ${
                          user.profile.estatus
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
                      <p
                        className="text-muted mb-0"
                        style={{ fontSize: "0.7rem", fontWeight: "500" }}
                      >
                        FECHA DE CREACIÓN
                      </p>
                      <p
                        className="text-dark mb-0 fw-medium"
                        style={{ fontSize: "0.8rem" }}
                      >
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
                      <p
                        className="text-muted mb-0"
                        style={{ fontSize: "0.7rem", fontWeight: "500" }}
                      >
                        ID DE USUARIO
                      </p>
                      <code
                        className="bg-white text-muted px-2 py-1 rounded border"
                        style={{ fontSize: "0.7rem" }}
                      >
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
          <Button
            type="button"
            variant="light"
            className="fw-medium px-4"
            onClick={handleClose}
          >
            Cancelar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UserViewModal;