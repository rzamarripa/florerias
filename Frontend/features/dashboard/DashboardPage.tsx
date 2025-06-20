"use client";

import { useUserSessionStore } from "@/stores";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Row,
  Table,
  Spinner,
  Alert,
} from "react-bootstrap";
import { HiCheckCircle, HiCog, HiDocumentText, HiUsers } from "react-icons/hi2";
import { useEffect, useState } from "react";
import { importLogService } from "./services/importLogService";
import profileBg from "@/assets/images/auth.jpg";
import userImage from "@/assets/images/users/user-2.jpg";
import Link from "next/link";

const DashboardPage = () => {
  const { user } = useUserSessionStore();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    importLogService
      .getAccountsStatusToday()
      .then((data) => {
        if (data.success) setAccounts(data.data as any[]);
        else setError("Error al cargar cuentas");
        setLoading(false);
      })
      .catch(() => {
        setError("Error al cargar cuentas");
        setLoading(false);
      });
  }, []);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("es-MX", {
        month: "short",
        year: "numeric",
      })
    : "N/A";

  return (
    <div className="min-vh-100 bg-light py-4">
      <Container fluid className="px-4">
        <Row>
          <Col xl={4}>
            <Card className="border-top-0">
              <div
                className="position-relative card-side-img overflow-hidden rounded-top"
                style={{
                  height: "180px",
                  backgroundImage: `url(${profileBg.src})`,
                }}
              >
                <div className="p-4 card-img-overlay rounded-start-0 auth-overlay d-flex rounded-top align-items-center justify-content-center">
                  <h5 className="text-white m-0 fst-italic">¡Bienvenido!</h5>
                </div>
              </div>

              {/* Card Body */}
              <Card.Body className="position-relative">
                <div className="d-flex justify-content-start gap-3">
                  <div
                    className="avatar avatar-xxl"
                    style={{ marginTop: "-60px" }}
                  >
                    <Link href="#">
                      <img
                        src={user?.profile?.image || userImage.src}
                        alt="User Profile"
                        className="img-fluid img-thumbnail rounded-circle"
                        style={{
                          height: "80px",
                          width: "80px",
                          objectFit: "cover",
                        }}
                      />
                    </Link>
                  </div>
                  <div>
                    <h4 className="text-nowrap fw-bold mb-1">
                      <Link
                        href="#"
                        className="text-reset text-decoration-none"
                      >
                        {user?.profile?.fullName || "Usuario"}
                      </Link>
                    </h4>
                    <p className="text-primary fw-medium mb-0">
                      {user?.role?.name || "Sin rol"}
                    </p>
                    <p className="text-muted mb-0">
                      Miembro desde {memberSince}
                    </p>
                  </div>
                </div>
              </Card.Body>
              {/* card-body*/}
            </Card>
            {/* end card*/}
          </Col>
          <Col xl={8}>
            <Card className="shadow-sm">
              <Card.Body>
                <h2 className="h5 fw-semibold text-dark mb-4">
                  Estatus de importación de cuentas bancarias (hoy)
                </h2>
                {loading ? (
                  <div className="text-center my-4">
                    <Spinner animation="border" />
                  </div>
                ) : error ? (
                  <Alert variant="danger">{error}</Alert>
                ) : (
                  <Table striped bordered hover responsive size="sm">
                    <thead>
                      <tr>
                        <th>Razón Social</th>
                        <th>Banco</th>
                        <th>Cuenta</th>
                        <th>CLABE</th>
                        <th>Importada hoy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.map((acc) => (
                        <tr key={acc._id}>
                          <td>{acc.company?.name}</td>
                          <td>{acc.bank?.name}</td>
                          <td>{acc.accountNumber}</td>
                          <td>{acc.clabe}</td>
                          <td className="text-center">
                            {acc.importedToday ? (
                              <Badge bg="success">Sí</Badge>
                            ) : (
                              <Badge bg="danger">No</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default DashboardPage;
