"use client";

import { Col, Container, Row } from "react-bootstrap";
import ImportStatusWidget from "./components/ImportStatusWidget";
import ProfileInfo from "./components/ProfileInfo";

const ConciliacionDashboardPage = () => {
  return (
    <Container fluid>
      <Row>
        <Col>
          <ProfileInfo />
        </Col>
      </Row>

      <Row>
        <Col>
          <ImportStatusWidget />
        </Col>
      </Row>
    </Container>
  );
};

export default ConciliacionDashboardPage;
